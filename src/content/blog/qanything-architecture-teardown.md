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

<figure class="diagram">
<svg viewBox="0 0 720 470" role="img" aria-label="QAnything 架构图：客户端经主容器访问 MySQL、Milvus 与 Elasticsearch，Milvus 依赖 etcd 与 minio">
  <defs>
    <marker id="qa-a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" style="fill:var(--muted)"/>
    </marker>
  </defs>
  <rect x="270" y="14" width="180" height="42" rx="10" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="360" y="35" text-anchor="middle" font-size="13" font-weight="600" style="fill:var(--text)">用户 / API 调用方</text>
  <text x="360" y="50" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">上传文档 · 提问</text>
  <line x1="360" y1="56" x2="360" y2="86" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a1)"/>

  <rect x="40" y="90" width="640" height="172" rx="14" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.6"/>
  <text x="58" y="114" font-size="13" font-weight="600" style="fill:var(--accent)">qanything_local · 主容器</text>
  <text x="662" y="114" text-anchor="end" font-size="11" style="fill:var(--muted)">镜像 v1.2.2 · shm 8GB</text>

  <rect x="58" y="130" width="182" height="46" rx="8" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="149" y="150" text-anchor="middle" font-size="12.5" font-weight="600" style="fill:var(--text)">Sanic API</text>
  <text x="149" y="166" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">上传 · 问答接口</text>

  <rect x="269" y="130" width="182" height="46" rx="8" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="360" y="150" text-anchor="middle" font-size="12.5" font-weight="600" style="fill:var(--text)">OCR 解析</text>
  <text x="360" y="166" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">PaddleOCR</text>

  <rect x="480" y="130" width="182" height="46" rx="8" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="571" y="150" text-anchor="middle" font-size="12.5" font-weight="600" style="fill:var(--text)">Embedding</text>
  <text x="571" y="166" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">Triton · 768 维</text>

  <rect x="58" y="192" width="182" height="46" rx="8" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="149" y="212" text-anchor="middle" font-size="12.5" font-weight="600" style="fill:var(--text)">前端页面</text>
  <text x="149" y="228" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">内置 Web UI</text>

  <rect x="269" y="192" width="182" height="46" rx="8" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="360" y="212" text-anchor="middle" font-size="12.5" font-weight="600" style="fill:var(--text)">Rerank 服务</text>
  <text x="360" y="228" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">本地 8776 端口</text>

  <rect x="480" y="192" width="182" height="46" rx="8" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="571" y="212" text-anchor="middle" font-size="12.5" font-weight="600" style="fill:var(--text)">LLM 兼容层</text>
  <text x="571" y="228" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">OpenAI 接口格式</text>

  <line x1="135" y1="262" x2="135" y2="298" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a1)"/>
  <line x1="360" y1="262" x2="360" y2="298" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a1)"/>
  <line x1="585" y1="262" x2="585" y2="298" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a1)"/>

  <rect x="40" y="300" width="190" height="60" rx="10" style="fill:var(--surface-2);stroke:var(--border);stroke-width:1.2"/>
  <text x="135" y="324" text-anchor="middle" font-size="13" font-weight="600" style="fill:var(--text)">MySQL 8.4</text>
  <text x="135" y="342" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">用户 · 知识库 · 文件状态</text>

  <rect x="250" y="300" width="220" height="60" rx="10" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>
  <text x="360" y="324" text-anchor="middle" font-size="13" font-weight="600" style="fill:var(--accent)">Milvus standalone</text>
  <text x="360" y="342" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">768 维向量 · 按库分 partition</text>

  <rect x="490" y="300" width="190" height="60" rx="10" style="fill:var(--surface-2);stroke:var(--border);stroke-width:1.2"/>
  <text x="585" y="324" text-anchor="middle" font-size="13" font-weight="600" style="fill:var(--text)">Elasticsearch</text>
  <text x="585" y="342" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">BM25 关键词补漏</text>

  <line x1="304" y1="360" x2="304" y2="376" style="stroke:var(--muted);stroke-width:1.4" marker-end="url(#qa-a1)"/>
  <line x1="420" y1="360" x2="420" y2="376" style="stroke:var(--muted);stroke-width:1.4" marker-end="url(#qa-a1)"/>
  <rect x="252" y="378" width="104" height="42" rx="7" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="304" y="396" text-anchor="middle" font-size="12" font-weight="600" style="fill:var(--text)">etcd</text>
  <text x="304" y="411" text-anchor="middle" font-size="10.5" style="fill:var(--text-soft)">元数据</text>
  <rect x="368" y="378" width="104" height="42" rx="7" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="420" y="396" text-anchor="middle" font-size="12" font-weight="600" style="fill:var(--text)">minio</text>
  <text x="420" y="411" text-anchor="middle" font-size="10.5" style="fill:var(--text-soft)">对象存储</text>

  <text x="360" y="452" text-anchor="middle" font-size="11" style="fill:var(--muted)">六个容器各管一段：主容器包办算力与接口，存储层各司其职</text>
</svg>
<figcaption>图 1：六个容器的分工。看起来复杂，其实只有主容器在干重活，其余五个都是它的支撑。</figcaption>
</figure>

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

<figure class="diagram">
<svg viewBox="0 0 720 470" role="img" aria-label="写入流程图：上传接口立即返回，后台任务完成解析、两级切分、embedding 与入库，状态从 gray 流转到 green">
  <defs>
    <marker id="qa-a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" style="fill:var(--muted)"/>
    </marker>
  </defs>
  <rect x="34" y="16" width="160" height="72" rx="10" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="114" y="43" text-anchor="middle" font-size="13" font-weight="600" style="fill:var(--text)">POST /upload_files</text>
  <text x="114" y="62" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">登记 + 落盘</text>
  <text x="114" y="78" text-anchor="middle" font-size="10.5" style="fill:var(--accent)">状态 = gray</text>
  <line x1="194" y1="52" x2="248" y2="52" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a2)"/>

  <rect x="250" y="16" width="180" height="72" rx="10" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>
  <text x="340" y="43" text-anchor="middle" font-size="13" font-weight="600" style="fill:var(--accent)">立即返回</text>
  <text x="340" y="62" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">asyncio.create_task</text>
  <text x="340" y="78" text-anchor="middle" font-size="10.5" style="fill:var(--text-soft)">300 页 PDF 也不阻塞问答</text>
  <line x1="430" y1="52" x2="484" y2="52" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a2)"/>

  <rect x="486" y="16" width="200" height="72" rx="10" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="586" y="43" text-anchor="middle" font-size="13" font-weight="600" style="fill:var(--text)">后台任务处理中</text>
  <text x="586" y="62" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">前端轮询状态直到终态</text>
  <text x="586" y="78" text-anchor="middle" font-size="10.5" style="fill:var(--text-soft)">插入 FilesPool 队列</text>

  <line x1="586" y1="88" x2="586" y2="118" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a2)"/>
  <rect x="440" y="120" width="292" height="112" rx="12" style="fill:var(--surface-2);stroke:var(--border);stroke-width:1.2"/>
  <text x="458" y="144" font-size="12.5" font-weight="600" style="fill:var(--accent)">insert_files_to_milvus</text>
  <text x="458" y="167" font-size="12" style="fill:var(--text)">① loader 解析 · 图片/PDF 走 PaddleOCR</text>
  <text x="458" y="190" font-size="12" style="fill:var(--text)">② 中文断句 100 → token 切块 400</text>
  <text x="458" y="213" font-size="12" style="fill:var(--text)">③ BCE 768 维 embedding → Milvus</text>

  <line x1="586" y1="232" x2="586" y2="262" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a2)"/>
  <rect x="430" y="264" width="256" height="60" rx="10" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="558" y="289" text-anchor="middle" font-size="12.5" font-weight="600" style="fill:var(--text)">MySQL 记录 chunk 数</text>
  <text x="558" y="307" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">document_status 更新</text>

  <line x1="430" y1="294" x2="286" y2="294" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a2)"/>
  <rect x="30" y="244" width="264" height="118" rx="10" style="fill:var(--surface-2);stroke:var(--border);stroke-width:1.2"/>
  <text x="46" y="266" font-size="12.5" font-weight="600" style="fill:var(--accent)">四种状态，四种结局</text>
  <circle cx="52" cy="290" r="5" style="fill:#94a3b8"/>
  <text x="64" y="294" font-size="11.5" style="fill:var(--text)">gray　已登记，后台处理中</text>
  <circle cx="52" cy="314" r="5" style="fill:#e5484d"/>
  <text x="64" y="318" font-size="11.5" style="fill:var(--text)">red　切分或 embedding 失败</text>
  <circle cx="52" cy="338" r="5" style="fill:#e6a23c"/>
  <text x="64" y="342" font-size="11.5" style="fill:var(--text)">yellow　Milvus 插入失败，可重试</text>
  <circle cx="52" cy="358" r="5" style="fill:#2f9e6e"/>
  <text x="64" y="362" font-size="11" style="fill:var(--text)">green　入库完成，可被检索</text>

  <text x="360" y="406" text-anchor="middle" font-size="11" style="fill:var(--muted)">上传和问答解耦，是这类系统最容易被 demo 忽略、但上线必需的一步</text>
  <text x="360" y="436" text-anchor="middle" font-size="11" style="fill:var(--muted)">同名文件 mode：soft 跳过 / strong 强制重传</text>
</svg>
<figcaption>图 2：写入流程。接口返回时文件还没进库，真正的活全在后台，前端靠四色状态判断结局。</figcaption>
</figure>

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

<figure class="diagram">
<svg viewBox="0 0 720 530" role="img" aria-label="查询流程图：提问后并行走向量检索与 BM25，合并去重后做 chunk 融合，再经 rerank、token 预算裁剪进入 prompt">
  <defs>
    <marker id="qa-a3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" style="fill:var(--muted)"/>
    </marker>
  </defs>
  <rect x="270" y="12" width="180" height="48" rx="10" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="360" y="42" text-anchor="middle" font-size="13" font-weight="600" style="fill:var(--text)">用户提问</text>

  <line x1="360" y1="60" x2="360" y2="84" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a3)"/>
  <line x1="190" y1="84" x2="530" y2="84" style="stroke:var(--muted);stroke-width:1.6"/>
  <line x1="190" y1="84" x2="190" y2="102" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a3)"/>
  <line x1="530" y1="84" x2="530" y2="102" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a3)"/>

  <rect x="40" y="104" width="300" height="84" rx="10" style="fill:var(--surface-2);stroke:var(--border);stroke-width:1.2"/>
  <text x="190" y="130" text-anchor="middle" font-size="12.5" font-weight="600" style="fill:var(--text)">Milvus 向量检索</text>
  <text x="190" y="150" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">L2 · IVF_FLAT · top_k = 100</text>
  <text x="190" y="168" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">距离 &lt; 1.1 才算有效</text>

  <rect x="380" y="104" width="300" height="84" rx="10" style="fill:var(--surface-2);stroke:var(--border);stroke-width:1.2"/>
  <text x="530" y="130" text-anchor="middle" font-size="12.5" font-weight="600" style="fill:var(--text)">Elasticsearch · BM25</text>
  <text x="530" y="150" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">关键词检索并行补漏</text>
  <text x="530" y="168" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">专有名词 / 型号 / 人名</text>

  <line x1="190" y1="188" x2="190" y2="214" style="stroke:var(--muted);stroke-width:1.6"/>
  <line x1="530" y1="188" x2="530" y2="214" style="stroke:var(--muted);stroke-width:1.6"/>
  <line x1="190" y1="214" x2="530" y2="214" style="stroke:var(--muted);stroke-width:1.6"/>
  <line x1="360" y1="214" x2="360" y2="234" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a3)"/>

  <rect x="180" y="236" width="360" height="58" rx="10" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="360" y="261" text-anchor="middle" font-size="12.5" font-weight="600" style="fill:var(--text)">按 chunk_id 去重合并</text>
  <text x="360" y="279" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">一条都没过 1.1？保底取 top_k，不让上下文空着</text>

  <line x1="360" y1="294" x2="360" y2="322" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a3)"/>
  <rect x="90" y="324" width="540" height="76" rx="12" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.6"/>
  <text x="360" y="349" text-anchor="middle" font-size="13" font-weight="600" style="fill:var(--accent)">expand_cand_docs · 把切碎的 chunk 拼回去</text>
  <text x="360" y="370" text-anchor="middle" font-size="11.5" style="fill:var(--text)">按 file_id 分组 → 向前后各查 200 块 → 拼到 800 token</text>
  <text x="360" y="388" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">新分数 = 1 − 最小L2 / √2　·　kernel 保留真正命中的句子</text>

  <line x1="360" y1="400" x2="360" y2="428" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a3)"/>
  <rect x="180" y="430" width="360" height="58" rx="10" style="fill:var(--surface);stroke:var(--border);stroke-width:1.2"/>
  <text x="360" y="455" text-anchor="middle" font-size="12.5" font-weight="600" style="fill:var(--text)">Rerank（默认开）+ token 预算裁剪</text>
  <text x="360" y="473" text-anchor="middle" font-size="11" style="fill:var(--text-soft)">超 300 字符跳过 · 低于 0.35 丢弃 · 挂了降级排序</text>

  <line x1="360" y1="488" x2="360" y2="500" style="stroke:var(--muted);stroke-width:1.6" marker-end="url(#qa-a3)"/>
  <text x="360" y="518" text-anchor="middle" font-size="11" style="fill:var(--muted)">prompt → LLM → 答案（数据多不等于效果好，前提是这套融合和重排都在）</text>
</svg>
<figcaption>图 3：查询流程。前四步是常规操作，中间那块紫色的 chunk 融合才是它和多数 RAG demo 的分水岭。</figcaption>
</figure>

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
