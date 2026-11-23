// Multica 文章配图：整体架构 / 一次运行链路 / 智能体组装模型（浅色 + 深色）
import fs from 'node:fs';
import path from 'node:path';
import { SVG, LIGHT, DARK, seed, setInk } from './sketch-lib.mjs';

// ---------- 图 1：整体架构 ----------
function archSVG(P) {
  seed(21); setInk(P.ink);
  const W = 760, H = 470;
  const s = new SVG(W, H);
  s.raw(`<rect width="${W}" height="${H}" fill="${P.paper}"/>`);
  s.text(W / 2, 42, 'Multica 架构：云端管协调，本地管执行', 21, { bold: true });

  // 云端协调层
  s.sketchRect(24, 62, 712, 148, P.blue, 2.2, { fill: P.blueFill, tilt: 1.2 });
  s.text(44, 90, '云端 · 记录与协调（托管版或自部署）', 13.5, { bold: true, anchor: 'start', color: P.blue });
  const cw = 122, cy = 102, ch = 58;
  const cols = [
    { x: 42, label: 'Web / 桌面端', sub: 'Next.js + Electron' },
    { x: 180, label: 'Go Server', sub: 'REST · 任务 · 队列' },
    { x: 318, label: 'PostgreSQL', sub: '工作区 · 状态' },
    { x: 456, label: 'WS Gateway', sub: 'NestJS 长连接' },
    { x: 594, label: '协作服务', sub: 'Yjs 实时编辑' },
  ];
  for (const c of cols) {
    s.sketchRect(c.x, cy, cw, ch, P.blue, 2, { fill: P.paper, tilt: 1.3 });
    s.text(c.x + cw / 2, cy + 24, c.label, 12.5, { bold: true });
    s.text(c.x + cw / 2, cy + 43, c.sub, 9.5, { color: P.muted });
  }
  s.arrow(166, 123, 178, 123, P.ink, 1.8, { curve: -2 });
  s.arrow(304, 123, 316, 123, P.ink, 1.8, { curve: 2 });
  // Server ↔ Gateway 走行下弧线，避开框内文字
  s.arrow(241, 164, 515, 164, P.dash, 1.6, { dash: true, curve: 22 });

  // 数据边界
  s.text(36, 232, '数据边界：云上只有协调数据，代码与凭据不出本机', 12.5, { anchor: 'start', color: P.red });
  s.sketchLine(432, 227, 736, 227, P.dash, 1.6, 1.2, false);

  // 本地执行层
  s.sketchRect(24, 254, 712, 142, P.green, 2.2, { fill: P.greenFill, tilt: 1.2 });
  s.text(44, 280, '你的电脑 · 执行（daemon + 运行时）', 13.5, { bold: true, anchor: 'start', color: P.green });
  s.sketchRect(490, 292, 200, 88, P.green, 2.2, { fill: P.paper, tilt: 1.3 });
  s.text(590, 322, 'daemon 常驻进程', 13, { bold: true });
  s.text(590, 342, '心跳上线 · 领取运行', 10, { color: P.muted });
  s.text(590, 360, '多台机器可同时接入', 10, { color: P.muted });
  s.sketchRect(258, 292, 212, 88, P.green, 2.2, { fill: P.paper, tilt: 1.3 });
  s.text(364, 320, '运行时 × N（最多 31 种）', 12.5, { bold: true });
  s.text(364, 340, 'Claude Code · Codex', 10, { color: P.muted });
  s.text(364, 358, 'Cursor · Kimi · OpenCode …', 10, { color: P.muted });
  s.sketchRect(42, 292, 198, 88, P.green, 2.2, { fill: P.paper, tilt: 1.3 });
  s.text(141, 322, '代码目录 / 凭据', 13, { bold: true });
  s.text(141, 342, '文件修改 · 命令执行', 10, { color: P.muted });
  s.text(141, 360, '只发生在本机', 10, { color: P.muted });
  s.arrow(488, 336, 472, 336, P.ink, 1.8, { curve: -2 });
  s.arrow(256, 336, 242, 336, P.ink, 1.8, { curve: 2 });

  // 穿越边界的双向连接（Gateway → daemon）
  s.arrow(520, 210, 534, 290, P.amber, 2.2, { curve: -2 });
  s.arrow(540, 290, 526, 210, P.amber, 2.2, { curve: 2 });
  s.text(506, 272, 'WS 双向', 11, { color: P.amber, anchor: 'end' });

  s.text(W / 2, 434, '平台只保存任务状态与事件；真正的文件读写和命令执行都在你自己的电脑上', 13, { color: P.muted });
  return s.out();
}

// ---------- 图 2：一次运行的链路 ----------
function runSVG(P) {
  seed(37); setInk(P.ink);
  const W = 760, H = 420;
  const s = new SVG(W, H);
  s.raw(`<rect width="${W}" height="${H}" fill="${P.paper}"/>`);
  s.text(W / 2, 44, '一次运行的完整链路：入队 → 领取 → 执行 → 写回', 21, { bold: true });

  const bw = 128, bh = 74, gap = 18;
  const xs = [36, 182, 328, 474, 620];
  const steps = [
    { label: '1 · 触发', sub: '指派 · @提及 · 对话', sub2: '自动化定时触发', fill: P.neutral, edge: P.ink },
    { label: '2 · 创建运行', sub: '带配置入队：指令', sub2: '模型 · skill · 运行时', fill: P.blueFill, edge: P.blue },
    { label: '3 · 运行时领取', sub: 'daemon 心跳在线', sub2: '即从队列领取', fill: P.blueFill, edge: P.blue },
    { label: '4 · 本地执行', sub: '调用 AI 编程工具', sub2: '读目录 · 跑命令', fill: P.amberFill, edge: P.amber },
    { label: '5 · 结果写回', sub: '评论 · 执行日志', sub2: '任务时间线可见', fill: P.greenFill, edge: P.green },
  ];
  for (let i = 0; i < 5; i++) {
    const b = steps[i], x = xs[i];
    s.sketchRect(x, 148, bw, bh, b.edge, 2.2, { fill: b.fill, tilt: 1.3 });
    s.text(x + bw / 2, 174, b.label, 13.5, { bold: true });
    s.text(x + bw / 2, 195, b.sub, 10, { color: P.muted });
    s.text(x + bw / 2, 211, b.sub2, 10, { color: P.muted });
    if (i < 4) s.arrow(x + bw + 2, 185, x + bw + gap - 2, 185, P.ink, 2);
  }

  // 等待回环：3 → 2 手肘形虚线，走在框上方
  s.raw(`<path d="M ${xs[2] + bw / 2} 144 L ${xs[2] + bw / 2} 124 L ${xs[1] + bw / 2} 124" fill="none" stroke="${P.dash}" stroke-width="1.8" stroke-dasharray="6 5" stroke-linecap="round"/>`);
  s.raw(`<path d="M ${xs[1] + bw / 2} 124 L ${xs[1] + bw / 2} 144" fill="none" stroke="${P.dash}" stroke-width="1.8" stroke-dasharray="6 5" stroke-linecap="round"/>`);
  s.sketchLine(xs[1] + bw / 2 - 5, 140, xs[1] + bw / 2, 146, P.dash, 1.8, 0.4, false);
  s.sketchLine(xs[1] + bw / 2 + 5, 140, xs[1] + bw / 2, 146, P.dash, 1.8, 0.4, false);
  s.text(319, 110, '没有在线运行时 → 排队等待', 11.5, { color: P.muted });

  // 失败重试：从 3 下方接回队列
  s.sketchRect(252, 296, 288, 56, P.red, 2, { fill: P.paper, tilt: 1.2 });
  s.text(396, 320, '失败 / 中断：可重试、可取消', 12.5, { bold: true, color: P.red });
  s.text(396, 340, '进度实时流回任务页', 10.5, { color: P.muted });
  s.arrow(392, 294, 392, 224, P.red, 1.6, { dash: true, curve: 0 });

  s.text(W / 2, 388, '运行结束 ≠ 任务完成：任务还能继续讨论、补充要求、再次触发', 12.5, { color: P.muted });
  return s.out();
}

// ---------- 图 3：智能体的组装模型 ----------
function agentSVG(P) {
  seed(53); setInk(P.ink);
  const W = 760, H = 462;
  const s = new SVG(W, H);
  s.raw(`<rect width="${W}" height="${H}" fill="${P.paper}"/>`);
  s.text(W / 2, 44, '智能体 = 一份配置：skill 复用，小队协同', 21, { bold: true });

  // Skill 库
  s.sketchRect(36, 158, 150, 96, P.amber, 2.4, { fill: P.amberFill, tilt: 1.3 });
  s.text(111, 192, 'Skill 库', 14.5, { bold: true });
  s.text(111, 214, '“这类活怎么做”', 11, { color: P.muted });
  s.text(111, 233, '可挂载给多个智能体', 10, { color: P.muted });

  // 两个智能体
  const agents = [
    { y: 92, name: '智能体 A', role: '写周报的运营助手' },
    { y: 226, name: '智能体 B', role: '盯 PR 的代码助手' },
  ];
  for (const a of agents) {
    s.sketchRect(268, a.y, 190, 100, P.blue, 2.4, { fill: P.blueFill, tilt: 1.3 });
    s.text(363, a.y + 28, a.name, 14, { bold: true });
    s.text(363, a.y + 48, '指令：“是谁” · 模型', 10.5, { color: P.muted });
    s.text(363, a.y + 66, '运行时：在哪执行', 10.5, { color: P.muted });
    s.text(363, a.y + 86, a.role, 10.5, { color: P.muted });
  }
  s.arrow(188, 190, 266, 136, P.amber, 2.2, { curve: -6 });
  s.arrow(188, 222, 266, 268, P.amber, 2.2, { curve: 6 });
  s.text(206, 164, '挂载', 11.5, { color: P.amber, anchor: 'start' });
  s.text(206, 250, '挂载', 11.5, { color: P.amber, anchor: 'start' });

  // 小队
  s.sketchRect(530, 76, 204, 268, P.green, 2.4, { fill: P.greenFill, tilt: 1.2 });
  s.text(632, 104, '小队', 14, { bold: true, color: P.green });
  s.sketchRect(552, 118, 160, 54, P.green, 2, { fill: P.paper, tilt: 1.3 });
  s.text(632, 140, 'leader 智能体', 12.5, { bold: true });
  s.text(632, 158, '领任务 · 拆解 · 协调', 10, { color: P.muted });
  s.sketchRect(552, 200, 76, 62, P.blue, 2, { fill: P.paper, tilt: 1.3 });
  s.text(590, 226, '成员', 11.5, { bold: true });
  s.text(590, 244, 'agent', 10.5, { color: P.muted });
  s.sketchRect(636, 200, 76, 62, P.blue, 2, { fill: P.paper, tilt: 1.3 });
  s.text(674, 226, '成员', 11.5, { bold: true });
  s.text(674, 244, '人类', 10.5, { color: P.muted });
  s.arrow(600, 174, 592, 198, P.ink, 1.8, { curve: -2 });
  s.arrow(664, 174, 672, 198, P.ink, 1.8, { curve: 2 });
  s.arrow(460, 148, 528, 158, P.ink, 2, { curve: -4 });
  s.arrow(460, 276, 528, 288, P.ink, 2, { curve: 4 });

  // 触发方式
  s.sketchRect(36, 352, 440, 58, P.blue, 2, { fill: P.neutral, tilt: 1.2 });
  s.text(256, 378, '触发即产生一次运行', 12.5, { bold: true });
  s.text(256, 398, '指派任务 · 评论 @提及 · 直接对话 · 自动化（定时/事件）', 11, { color: P.muted });

  s.text(W / 2, 442, '指令定义智能体是谁，skill 沉淀成功经验；小队让多个智能体像项目组一样干活', 12.5, { color: P.muted });
  return s.out();
}

const outDir = path.resolve('public/images');
fs.mkdirSync(outDir, { recursive: true });
const jobs = [
  ['multica-arch', archSVG], ['multica-run', runSVG], ['multica-agent', agentSVG],
];
for (const [name, fn] of jobs) {
  fs.writeFileSync(path.join(outDir, `${name}.svg`), fn(LIGHT));
  fs.writeFileSync(path.join(outDir, `${name}-dark.svg`), fn(DARK));
}
console.log('generated:', jobs.map((j) => j[0]).join(', '));
