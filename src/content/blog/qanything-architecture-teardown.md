---
title: 拆开 QAnything：它做的不是新算法，是把 RAG 的脏活干完了
description: 从源码看 QAnything 的真实架构——六个容器怎么分工、上传状态机怎么跑、检索为什么先召回 100 条再把 chunk 拼回去；附带几处文档没写、但代码里看得见的别扭地方。
pubDate: 2026-11-27
category: 架构
tags: [RAG, 知识库, 开源, 架构, QAnything]
featured: false
---

做本地知识库问答的人大概都撞过同一堵墙：demo 跑得很顺，换成真实的 PDF 就露馅——表格跨页、标题和正文断开、召回回来的片段缺上半句。模型再强，喂给它的上下文是半截的，答案也只能是半截的。

QAnything 吸引我的地方不是它提出了什么新算法。它做的事情更朴素：把这些脏活一件件做完了，而且做法都摊在开源代码里。仓库到 2026 年 11 月有 14.2k star，最后一次提交是 9 月下旬，不算活跃，但代码量够我们看清楚一个完整的 RAG 系统应该怎么落地。

这篇按「写进去」和「查出来」两条线拆，重点放在流程，不抄 README 的宣传语。

## 一、先看它把自己拆成了几块

README 里那句「支持任意格式」听着像营销，但 `docker-compose-linux.yaml` 里六个服务的分工是实打实的：

| 容器 | 用的东西 | 在这套系统里干什么 |
|---|---|---|
| elasticsearch | ES 8.11.4 | BM25 关键词检索，给向量检索补漏 |
| etcd | v3.5.5 | Milvus 的元数据 |
| minio | 2023-03-20 版 | Milvus 的对象存储 |
| standalone | Milvus v2.3.4 | 存 768 维向量，按知识库分 partition |
| mysql | MySQL 8.4 | 管用户、知识库、文件状态和 chunk 数量 |
| qanything_local | freeren/qanything:v1.2.2 | 主容器：Sanic API、前端、OCR、embed、rerank、LLM 兼容层都在这里 |

主容器把剩下的职责全装进去了，里面还起了 Triton 推理服务跑 embedding，外部则通过 OpenAI 兼容接口接大模型——v2.0 之后不再自带默认本地模型，想离线就得自己装 ollama。

代价写得明明白白：README 要求至少 20GB 内存，主容器 `shm_size` 给了 8GB。这不是一个能在普通笔记本上随手跑起来的项目。

顺手记一个细节：README 的离线部署章节拉的是 Milvus v2.4.8，compose 文件里写的是 v2.3.4；镜像 tag 还是 `v1.2.2`，正文却在讲 v2.0 的新特性。文档没跟代码对齐，接手的人得留个心眼。

## 二、写进去：上传接口返回的时候，文件还没进库

`handler.py` 的 `upload_files` 有一个容易被忽略的设计：它只做登记和落盘，真正的解析、切分、embedding、入库全丢给后台任务。

```python
local_file = LocalFile(user_id, kb_id, file, file_id, file_name, local_doc_qa.embeddings)
asyncio.create_task(local_doc_qa.insert_files_to_milvus(user_id, kb_id, local_files))
```

所以接口立刻返回，状态是 `gray`。前端随后轮询状态，四种颜色对应四种结局：

| 状态 | 含义 | 下一步 |
|---|---|---|
| gray | 已登记，后台处理中 | 等 |
| red | 切分或 embedding 失败 | 检查文件类型，重新传 |
| yellow | Milvus 插入失败 | 可重试 |
| green | 入库完成，可以被检索 | — |

这个设计解决了知识库产品里很常见的一个体验问题：传一个 300 页的 PDF，用户不可能对着转圈等半分钟。上传和问答解耦之后，传文件不会卡住正在进行的问答。

同名文件还有个 `mode` 参数：`soft` 跳过同名，`strong` 强制重传。落盘时用 `safe_join` 防路径穿越，用 `O_EXCL | O_NOFOLLOW` 加 0600 权限写文件——这几行在 `local_file.py` 里不起眼，但属于真正做过多用户系统的写法。

## 三、切分：两级，而且第二级是按 token 算的

`local_file.py` 里切文本分两步。

第一步用 `ChineseTextSplitter`，按中文标点断句，`SENTENCE_SIZE = 100`。它专门处理了引号里的句号——「他说完了。」这种不能把句号后面的引号拆散，正则写得挺细。PDF 还会先把多余空白压掉。

第二步用 `RecursiveCharacterTextSplitter`，分隔符里中英文标点混排，`chunk_size=400`，关键是 `length_function=num_tokens`——按 token 数切，不是按字符数。中文场景下这两者差别不小。

还有个开关 `ZH_TITLE_ENHANCE = False`：打开后会把标题拼进正文块，默认没开。多数人装完就直接用，其实少拿了一个提升检索命中率的功能。

不同格式走不同 loader：xlsx 按 sheet 逐个转成 csv 再读，docx / pptx / eml 用 unstructured 系列，图片和 PDF 走 PaddleOCR。表格类文件在后面有个特殊待遇，我们下面讲。

## 四、查出来：先宽召回，别急着精

第一次检索的参数在 `model_config.py` 里：`VECTOR_SEARCH_TOP_K = 100`。

一次提问先往 Milvus 里捞 100 条。Milvus 用 L2 距离、IVF_FLAT 索引（nlist 2048，查询时 nprobe 256），embedding 是 BCE 的 768 维向量，存之前做了归一化。

`parse_batch_result` 里有个保底逻辑：距离小于 `threshold = 1.1` 的才算有效候选，但如果一条都没过线，就直接取 top_k。这是典型的「宁可给点不太相关的，也别让上下文空着」。

同时 `HYBRID_SEARCH = True`，ES 那边的 BM25 也会搜一轮，按 chunk_id 去重后补进来。也就是关键词检索和向量检索并行跑，谁命中的合并谁。这一步对中文场景里的专有名词、型号、人名帮助很大——纯向量对这些词经常抓瞎。

到这里都是常规操作。真正有意思的是下一步。

## 五、最值得抄的一段：把切碎的 chunk 拼回去

`milvus_client.py` 的 `expand_cand_docs` / `process_group`，是我觉得整个项目最值钱的部分。

前面切出来的 chunk 只有 400 token，语义天然是断的。直接把这 100 个碎片按分数塞进 prompt，模型看到的是一堆互不相连的半截话。QAnything 的做法是：

1. 按 `file_id` 把命中 chunk 分组；
2. 每组向前后最多查 ±200 个相邻 chunk（`chunk_id` 是 `file_id_序号`，序号连续）；
3. 从命中点向两边扩张，把连续编号的块拼成一段，总长度不超过 `CHUNK_SIZE = 800`；
4. 这一段的新分数 = `1 - 最小L2距离 / √2`，并把真正命中的原始块留进 `kernel` 字段；
5. csv 和 xlsx 跳过这一步，表格按行切，拼起来反而会串味。

我看到这里停了一下。这一步才是它和多数 RAG demo 的分水岭：**检索单位和存储单位可以不是同一个东西**。存的时候切小，为了检索精确；喂给模型的时候拼大，为了语义完整。很多项目在切完 chunk 之后就直接进 prompt，等于把切分造成的语义损失全部转嫁给了模型。

`kernel` 字段这个设计也挺实用——最后展示引用来源时，能区分「真正命中的句子」和「为了上下文补上的邻居」。

这段代码的账也不全是漂亮的：`process_group` 里如果连续编号的第一个块不在查询结果中，`doc` 可能没被赋值就进循环，异常被 `except` 吞掉，整组候选直接没了。功能上不影响主流程，但排查「某些文件怎么老是搜不到」的时候，这里是个值得看的地方。

## 六、rerank：默认开，但有两条硬规则

README 把「两阶段检索」当作卖点反复讲，代码里对应的实现其实很短，在 `local_doc_qa.py` 的 `rerank_documents_for_local`：

- `handler.py` 里 `rerank = safe_get(req, 'rerank', default=True)`，API 层默认开；有意思的是 `get_knowledge_based_answer` 函数签名里默认 `rerank=False`，两层默认值不一致，靠 handler 兜住了。
- query 长度超过 300 就直接跳过 rerank。注释写的是「tokens 数量超过 300」，代码用的是 `len(query)`，中文里这俩差着两三倍。
- 调本地 8776 端口的 rerank 服务，拿回分数后排序；分数低于 0.35 且已经有保留结果就丢掉——但第一条无论多低分都留着，保证上下文不空。
- rerank 服务挂了或超时，降级成按原始向量分数排序，不会让整个问答失败。

最后这条降级我觉得比 rerank 本身更重要。一个额外的模型服务，早晚会有重启、超时、OOM 的时候；把它设计成「没了也能跑」，才是能上线系统该有的样子。

## 七、塞进 prompt 之前，还要按 token 预算裁一刀

`reprocess_source_documents` 干的是预算分配的活：

```python
limited_token_nums = (llm.token_window - llm.max_token - llm.offcut_token
                      - query_token_num - history_token_num - template_token_num)
```

留够输出、提问、历史、模板的位置，剩下的额度按顺序装检索到的文档。装到最后一个超了，就从这段内容的**首尾各切一段**，保留中间，反复切到装得下为止。

切中间不切两头，这个取舍有点反直觉——一般摘要会保留开头。但它和前面的 chunk 融合是一套思路：命中点往往在块中间，首尾更可能是上一个块或下一个块的衔接内容，切掉它们损失更小。

prompt 模板本身也值得一看：明确要求「从参考信息中选出与问题最相关的那些」「忠于原文」「不要胡乱编造」，还要求回答语种跟随提问语种。这几句看着普通，实际是把中英混排文档场景里的常见翻车点提前堵上了。历史对话默认只带 3 轮（`LLM_HISTORY_LEN = 3`），超过就截。

## 八、几处我看着别扭的地方

写得再好的项目也有账：

- **重。** 20GB 内存、六个容器、4.88GB 的镜像，个人机器基本别想。它从一开始就是给有服务器的人准备的。
- **版本号对不上。** compose 里的 Milvus、镜像 tag 和 README 正文各说各话，离线部署那一节照着拉可能会拉到不同版本。
- **长问题吃亏。** query 超过 300 字符自动关掉 rerank，而中文一个汉字算一个字符，三百字的问题不算长。复杂提问反而拿不到精排。
- **去重过粗。** `deduplicate_documents` 按 `page_content` 去重，不同文档里的相同段落会被合并成一条，出处只剩第一个。
- **许可要读。** AGPL-3.0，商用不是「开源就能拿走」那么简单；相关的 Qwen 模型另有许可条款，README 也提醒了。
- **节奏慢了。** 最后一次 push 在 2026 年 9 月，问题列表里积了不少待处理项。当成参考实现读很值，当成长期依赖要慎重。

## 九、什么人该用，什么人只该抄

如果你的文档以中文为主、量比较大、必须断网运行、手上有一台内存够的机器，QAnything 是一套相当完整的参考实现。解析、状态管理、混合检索、chunk 融合、rerank、引用溯源，该有的都齐了。

如果你只是想验证一个想法，或者机器只有 16GB 内存，先别碰这套 compose。它的问题是「太完整」——六个容器全起来，光环境就能磨掉半天。

我自己从里面拿走的是两条，投入产出比最高：

1. **检索完之后，把相邻 chunk 拼回去再喂给模型。** 改动量很小，效果通常立竿见影。
2. **给 rerank 这类可选服务准备降级路径。** 它不是锦上添花，是系统能不能长期跑的关键。

至于「数据越多效果越好」这句宣传，看完代码我的理解是：它成立的前提是那套融合和重排逻辑都在，而且你的服务器扛得住 100 条召回加一次精排。把前提去掉，这句话就只是一句好听的话。

项目地址：[netease-youdao/QAnything](https://github.com/netease-youdao/QAnything)，许可证 AGPL-3.0。文中提到的文件路径都来自 master 分支，行号会随更新变动，看逻辑就好。
