// RAG 文章配图：总链路 / 小-大块分块 / 混合检索 / 评测闭环（浅色 + 深色）
import fs from 'node:fs';
import path from 'node:path';
import { SVG, LIGHT, DARK, seed, setInk, j } from './sketch-lib.mjs';

// ---------- 图 1：RAG 全链路 ----------
function pipelineSVG(P) {
  seed(11); setInk(P.ink);
  const W = 760, H = 470;
  const s = new SVG(W, H);
  s.raw(`<rect width="${W}" height="${H}" fill="${P.paper}"/>`);
  s.text(W / 2, 44, 'RAG 全链路：离线摄入 + 在线查询', 21, { bold: true });

  const bw = 112, bh = 62, gap = 22;
  const xs = [40, 174, 308, 442, 576];

  // 离线泳道
  s.text(40, 88, '离线 · 数据摄入（批处理，可以慢）', 14, { bold: true, anchor: 'start', color: P.muted });
  const row1 = [
    { label: '文档源', sub: 'PDF / wiki / 库表', fill: P.neutral, edge: P.ink },
    { label: '解析与清洗', sub: '版面 · 表格 · OCR', fill: P.neutral, edge: P.ink },
    { label: '结构分块', sub: '256~512 token', fill: P.amberFill, edge: P.amber },
    { label: '嵌入', sub: 'embedding 模型', fill: P.blueFill, edge: P.blue },
    { label: '索引库', sub: '向量 + 倒排', fill: P.greenFill, edge: P.green },
  ];
  for (let i = 0; i < 5; i++) {
    const b = row1[i], x = xs[i];
    s.sketchRect(x, 100, bw, bh, b.edge, 2.2, { fill: b.fill, tilt: 1.3 });
    s.text(x + bw / 2, 126, b.label, 13.5, { bold: true });
    s.text(x + bw / 2, 147, b.sub, 10.5, { color: P.muted });
    if (i < 4) s.arrow(x + bw + 2, 131, x + bw + gap - 2, 131, P.ink, 2);
  }

  // 在线泳道
  s.text(40, 258, '在线 · 查询（延迟敏感，毫秒级预算）', 14, { bold: true, anchor: 'start', color: P.muted });
  const row2 = [
    { label: '用户问题', sub: '多轮带指代', fill: P.neutral, edge: P.ink },
    { label: '查询改写', sub: '消解 · 变体扩展', fill: P.neutral, edge: P.ink },
    { label: '混合检索', sub: 'BM25 + 向量', fill: P.blueFill, edge: P.blue },
    { label: '重排', sub: 'cross-encoder', fill: P.amberFill, edge: P.amber },
    { label: '生成与引用', sub: '带 [1][2] 出处', fill: P.greenFill, edge: P.green },
  ];
  for (let i = 0; i < 5; i++) {
    const b = row2[i], x = xs[i];
    s.sketchRect(x, 270, bw, bh, b.edge, 2.2, { fill: b.fill, tilt: 1.3 });
    s.text(x + bw / 2, 296, b.label, 13.5, { bold: true });
    s.text(x + bw / 2, 317, b.sub, 10.5, { color: P.muted });
    if (i < 4) s.arrow(x + bw + 2, 301, x + bw + gap - 2, 301, P.ink, 2);
  }

  // 索引库 → 混合检索（虚线）
  s.arrow(xs[4] + bw / 2, 166, xs[2] + bw / 2 + 20, 266, P.dash, 1.8, { dash: true, curve: 8 });
  s.text(610, 218, 'top-k 候选', 12, { color: P.muted });

  s.text(W / 2, 400, '解析与分块决定上限，检索与重排决定下限，评测告诉你现在在哪', 13.5, { color: P.muted });
  s.text(W / 2, 428, '权限过滤放在检索层，而不是靠提示词"叮嘱"模型', 12.5, { color: P.red });
  return s.out();
}

// ---------- 图 2：小-大块 ----------
function chunkSVG(P) {
  seed(31); setInk(P.ink);
  const W = 760, H = 440;
  const s = new SVG(W, H);
  s.raw(`<rect width="${W}" height="${H}" fill="${P.paper}"/>`);
  s.text(W / 2, 44, '小-大块：检索用小块，生成用大块', 21, { bold: true });

  // 左：原始文档示意
  s.sketchRect(40, 108, 150, 250, P.ink, 2.2, { fill: P.neutral, tilt: 1.3 });
  s.text(115, 96, '原始文档', 14, { bold: true });
  s.text(115, 136, '第一章 标题', 12, { bold: true, anchor: 'start', color: P.blue, x: 54 });
  for (const y of [158, 174, 190]) s.sketchLine(54, y, 176, y + j(1.5), P.muted, 1.4, 1.2, false);
  s.text(115, 216, '第二章 标题', 12, { bold: true, anchor: 'start', color: P.blue, x: 54 });
  for (const y of [238, 254, 270, 286]) s.sketchLine(54, y, 176, y + j(1.5), P.muted, 1.4, 1.2, false);
  s.text(115, 322, '（含表格 / 代码）', 10.5, { color: P.muted });

  // 中：子块
  const chips = [
    { y: 110, label: '子块 1', fill: P.blueFill, edge: P.blue },
    { y: 168, label: '子块 2 ★', fill: P.amberFill, edge: P.amber, hot: true },
    { y: 226, label: '子块 3', fill: P.blueFill, edge: P.blue },
    { y: 284, label: '子块 4', fill: P.blueFill, edge: P.blue },
  ];
  s.text(330, 96, '子块 · 128~256 token', 13.5, { bold: true });
  for (const c of chips) {
    s.sketchRect(262, c.y, 136, 48, c.edge, c.hot ? 2.6 : 2, { fill: c.fill, tilt: 1.2 });
    s.text(330, c.y + 29, c.label, 12.5, { bold: !!c.hot, color: c.hot ? P.amber : P.ink });
  }
  s.arrow(190, 200, 258, 200, P.ink, 2, { curve: 4 });
  s.text(224, 186, '结构切分', 11, { color: P.muted });

  // 右：父块
  s.text(612, 96, '父块 · 512~1024 token', 13.5, { bold: true });
  s.sketchRect(500, 110, 224, 222, P.amber, 2.6, { fill: P.amberFill, tilt: 1.3 });
  for (let i = 0; i < 4; i++) {
    const y = 126 + i * 50;
    const hot = i === 1;
    s.sketchRect(516, y, 192, 40, hot ? P.amber : P.ink, hot ? 2.4 : 1.6, { fill: hot ? P.amberFill : P.paper, tilt: 1 });
    s.text(612, y + 25, hot ? '子块 2 ★ 命中' : `子块 ${i + 1}`, 11.5, { color: hot ? P.amber : P.muted, bold: hot });
  }
  s.arrow(400, 192, 496, 192, P.amber, 2.6, { curve: -5 });
  s.text(448, 176, '命中即整块带出', 11.5, { color: P.amber, bold: true });

  s.text(W / 2, 384, '检索粒度小 → 召回准；喂给模型的粒度大 → 上下文全', 13.5, { color: P.muted });
  s.text(W / 2, 412, '表格与代码块不要硬切：转 Markdown，或"摘要 + 原文"存两份', 12.5, { color: P.muted });
  return s.out();
}

// ---------- 图 3：混合检索 ----------
function hybridSVG(P) {
  seed(53); setInk(P.ink);
  const W = 760, H = 420;
  const s = new SVG(W, H);
  s.raw(`<rect width="${W}" height="${H}" fill="${P.paper}"/>`);
  s.text(W / 2, 44, '混合检索：BM25 + 向量，RRF 融合', 21, { bold: true });

  // 查询
  s.sketchRect(24, 182, 96, 58, P.ink, 2.2, { fill: P.neutral, tilt: 1.3 });
  s.text(72, 207, '查询', 14.5, { bold: true });
  s.text(72, 227, '改写后', 10.5, { color: P.muted });

  // 两条检索路径
  s.arrow(122, 200, 148, 132, P.blue, 2.2, { curve: -5 });
  s.arrow(122, 222, 148, 280, P.green, 2.2, { curve: 5 });

  s.sketchRect(150, 96, 146, 60, P.blue, 2.2, { fill: P.blueFill, tilt: 1.3 });
  s.text(223, 122, 'BM25 倒排', 13.5, { bold: true });
  s.text(223, 142, '型号 · 代码 · 专名', 10, { color: P.muted });

  s.sketchRect(150, 262, 146, 60, P.green, 2.2, { fill: P.greenFill, tilt: 1.3 });
  s.text(223, 288, '向量近邻', 13.5, { bold: true });
  s.text(223, 308, '换个说法也能命中', 10, { color: P.muted });

  // 候选列表
  for (const row of [{ y: 96, edge: P.blue, fill: P.blueFill, label: 'Top 200 · 词面匹配' },
                     { y: 262, edge: P.green, fill: P.greenFill, label: 'Top 200 · 语义匹配' }]) {
    s.sketchRect(326, row.y, 140, 60, row.edge, 2, { fill: row.fill, tilt: 1.2 });
    s.text(396, row.y + 24, row.label, 11, { bold: true });
    for (let i = 0; i < 3; i++) s.sketchLine(342, row.y + 35 + i * 8, 450, row.y + 35 + i * 8, row.edge, 1.2, 0.8, false);
    s.arrow(298, row.y + 30, 322, row.y + 30, row.edge, 2);
  }

  // RRF 融合
  s.arrow(468, 126, 498, 188, P.ink, 2.2, { curve: -6 });
  s.arrow(468, 292, 498, 234, P.ink, 2.2, { curve: 6 });
  s.sketchRect(500, 180, 104, 62, P.amber, 2.6, { fill: P.amberFill, tilt: 1.3 });
  s.text(552, 205, 'RRF 融合', 13, { bold: true });
  s.text(552, 226, 'k = 60', 10.5, { color: P.muted });

  // 重排
  s.arrow(606, 211, 628, 211, P.ink, 2.2, { curve: -2 });
  s.sketchRect(630, 178, 104, 66, P.amber, 2.2, { fill: P.amberFill, tilt: 1.2 });
  s.text(682, 204, '重排', 13.5, { bold: true });
  s.text(682, 224, 'Top 5~8 进上下文', 9.5, { color: P.muted });

  s.text(W / 2, 372, '召回要宽（各取几百条），重排要精（最后留十来条）', 13.5, { color: P.muted });
  s.text(W / 2, 398, '两路分数分布不同，别做线性加权——RRF 只看排名，稳', 12.5, { color: P.muted });
  return s.out();
}

// ---------- 图 4：评测闭环 ----------
function evalSVG(P) {
  seed(71); setInk(P.ink);
  const W = 760, H = 410;
  const s = new SVG(W, H);
  s.raw(`<rect width="${W}" height="${H}" fill="${P.paper}"/>`);
  s.text(W / 2, 44, '评测闭环：先有评测集，再谈优化', 21, { bold: true });

  const boxes = [
    { x: 48, y: 108, w: 168, h: 76, label: '真实 query 抽样', sub: '从线上日志取，别自己编', fill: P.neutral, edge: P.ink },
    { x: 296, y: 108, w: 168, h: 76, label: '标注评测集', sub: '问题 → 期望引用 / 要点', fill: P.blueFill, edge: P.blue },
    { x: 544, y: 108, w: 172, h: 76, label: '离线指标', sub: 'recall@k · MRR · 忠实度', fill: P.greenFill, edge: P.green },
    { x: 544, y: 268, w: 172, h: 76, label: '变更前回归', sub: '换模型 / 调参先跑一遍', fill: P.neutral, edge: P.ink },
    { x: 296, y: 268, w: 168, h: 76, label: '线上 badcase', sub: '点踩 · 空引用 · 无召回', fill: P.amberFill, edge: P.amber },
    { x: 48, y: 268, w: 168, h: 76, label: '回流标注', sub: '进入评测集，滚雪球', fill: P.neutral, edge: P.ink },
  ];
  for (const b of boxes) {
    s.sketchRect(b.x, b.y, b.w, b.h, b.edge, 2.2, { fill: b.fill, tilt: 1.3 });
    s.text(b.x + b.w / 2, b.y + 30, b.label, 13.5, { bold: true });
    s.text(b.x + b.w / 2, b.y + 52, b.sub, 10.5, { color: P.muted });
  }
  // 环形箭头
  s.arrow(216, 146, 292, 146, P.ink, 2.2, { curve: -3 });
  s.arrow(464, 146, 540, 146, P.ink, 2.2, { curve: 3 });
  s.arrow(630, 184, 630, 264, P.ink, 2.2, { curve: -3 });
  s.arrow(540, 306, 468, 306, P.ink, 2.2, { curve: -3 });
  s.arrow(292, 306, 220, 306, P.ink, 2.2, { curve: 3 });
  s.arrow(202, 262, 330, 190, P.blue, 2.2, { dash: true, curve: -8 });
  s.text(212, 252, '补进评测集', 11.5, { color: P.blue, anchor: 'start' });

  s.text(W / 2, 386, '没有评测集，每次调参都只是"感觉变好了"', 13.5, { color: P.muted });
  return s.out();
}

const outDir = path.resolve('public/images');
fs.mkdirSync(outDir, { recursive: true });
const jobs = [
  ['rag-pipeline', pipelineSVG], ['rag-chunk', chunkSVG],
  ['rag-hybrid', hybridSVG], ['rag-eval', evalSVG],
];
for (const [name, fn] of jobs) {
  fs.writeFileSync(path.join(outDir, `${name}.svg`), fn(LIGHT));
  fs.writeFileSync(path.join(outDir, `${name}-dark.svg`), fn(DARK));
}
console.log('generated:', fs.readdirSync(outDir).join(', '));
