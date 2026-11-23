// 手绘风格 SVG 生成器：抖动线条 + 双重描边模拟铅笔草图
// 输出浅色 / 深色两套配色，供页面跟随主题切换
import fs from 'node:fs';
import path from 'node:path';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rnd = mulberry32(42);
const j = (amp) => (rnd() * 2 - 1) * amp;

function wobblyLine(x1, y1, x2, y2, amp = 1.6) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const pts = [[x1, y1]];
  for (const t of [0.25, 0.5, 0.75]) {
    const o = j(amp) * (t === 0.5 ? 1.2 : 0.8);
    pts.push([x1 + dx * t + nx * o, y1 + dy * t + ny * o]);
  }
  pts.push([x2, y2]);
  return 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ');
}

let INK = '#3f3a34';

class SVG {
  constructor(w, h) { this.w = w; this.h = h; this.parts = []; }
  raw(s) { this.parts.push(s); }
  sketchLine(x1, y1, x2, y2, stroke, width = 2, amp = 1.6, second = true) {
    this.raw(`<path d="${wobblyLine(x1, y1, x2, y2, amp)}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`);
    if (second) {
      this.raw(`<path d="${wobblyLine(x1, y1, x2, y2, amp * 1.4)}" fill="none" stroke="${stroke}" stroke-width="${width * 0.7}" stroke-linecap="round" opacity="0.4"/>`);
    }
  }
  sketchRect(x, y, w, h, stroke, width = 2, opts = {}) {
    const o = opts.tilt ?? 1.4;
    if (opts.fill) this.raw(`<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="4" fill="${opts.fill}"/>`);
    const c = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    for (let i = 0; i < 4; i++) {
      const a = c[i], b = c[(i + 1) % 4];
      this.sketchLine(a[0] + j(o), a[1] + j(o), b[0] + j(o), b[1] + j(o), stroke, width, 1.2);
    }
  }
  arrow(x1, y1, x2, y2, stroke, width = 2, opts = {}) {
    const mx = (x1 + x2) / 2 + j(opts.curve ?? 5);
    const my = (y1 + y2) / 2 + j(opts.curve ?? 5);
    this.raw(`<path d="M ${x1} ${y1} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" ${opts.dash ? 'stroke-dasharray="6 5"' : ''}/>`);
    const ang = Math.atan2(y2 - my, x2 - mx);
    for (const s of [-1, 1]) {
      const a = ang + Math.PI + s * 0.42;
      this.sketchLine(x2, y2, x2 + Math.cos(a) * 9, y2 + Math.sin(a) * 9, stroke, width, 0.5, false);
    }
  }
  text(x, y, str, size = 16, opts = {}) {
    this.raw(
      `<text x="${x}" y="${y}" font-size="${size}" fill="${opts.color || INK}" font-weight="${opts.bold ? '700' : '400'}" text-anchor="${opts.anchor || 'middle'}">${str}</text>`
    );
  }
  out() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" font-family='"Patrick Hand","Comic Sans MS","Kaiti SC","STKaiti","KaiTi","楷体",cursive'>\n` + this.parts.join('\n') + '\n</svg>';
  }
}

const LIGHT = {
  paper: '#fffdf4', ink: '#3f3a34', muted: '#8a8378', neutral: '#f2eee2', dash: '#b3aca0',
  amber: '#c77b2e', amberFill: '#faeeda',
  blue: '#4a7ec2', blueFill: '#e6eefb',
  green: '#4e9a63', greenFill: '#e3f1e5',
  red: '#c25a4a',
};
const DARK = {
  paper: '#1f1c17', ink: '#e9e3d5', muted: '#9a9287', neutral: '#2a2620', dash: '#6e6659',
  amber: '#d9a05c', amberFill: '#33291c',
  blue: '#7aa6e8', blueFill: '#1e2a3a',
  green: '#7dbb8f', greenFill: '#1e2f24',
  red: '#dd8a76',
};

// ---------- 图 1：架构图（渐进式披露三层加载） ----------
function archSVG(P) {
  rnd = mulberry32(7);
  INK = P.ink;
  const W = 760, H = 440;
  const s = new SVG(W, H);
  s.raw(`<rect width="${W}" height="${H}" fill="${P.paper}"/>`);
  s.text(W / 2, 44, 'Agent Skill：渐进式披露的三层加载', 21, { bold: true });

  const fx = 52, fy = 116, fw = 212, fh = 264;
  s.sketchLine(fx, fy, fx + 66, fy, P.ink, 2.2);
  s.sketchLine(fx + 66, fy, fx + 80, fy - 18, P.ink, 2.2);
  s.sketchLine(fx + 80, fy - 18, fx + 150, fy - 18, P.ink, 2.2);
  s.sketchRect(fx, fy, fw, fh, P.ink, 2.4);
  s.text(fx + 82, fy - 26, 'my-skill/', 15.5, { bold: true, anchor: 'start' });

  const cards = [
    { y: 134, label: 'name + description', sub: '每个约 10 token', fill: P.amberFill, edge: P.amber },
    { y: 218, label: 'SKILL.md', sub: '完整指令，一屏', fill: P.blueFill, edge: P.blue },
    { y: 302, label: 'reference / scripts', sub: '细节与脚本', fill: P.greenFill, edge: P.green },
  ];
  const left = [];
  for (const c of cards) {
    s.sketchRect(fx + 16, c.y, fw - 32, 62, c.edge, 2, { fill: c.fill, tilt: 1.2 });
    s.text(fx + fw / 2, c.y + 27, c.label, 14, { bold: true });
    s.text(fx + fw / 2, c.y + 48, c.sub, 11.5, { color: P.muted });
    left.push([fx + fw, c.y + 31]);
  }

  const ax = 482, ay = 116, aw = 228, ah = 264;
  s.sketchRect(ax, ay, aw, ah, P.ink, 2.4);
  s.text(ax + aw / 2, ay - 22, 'Agent 的上下文', 15.5, { bold: true });

  const bands = [
    { y: 134, label: '第 1 层 · 常驻', note: '一直都在，花销极小', fill: P.amberFill, edge: P.amber },
    { y: 218, label: '第 2 层 · 触发', note: '请求匹配时才读入', fill: P.blueFill, edge: P.blue },
    { y: 302, label: '第 3 层 · 按需', note: '要细节才读 / 执行', fill: P.greenFill, edge: P.green },
  ];
  const right = [];
  for (const b of bands) {
    s.sketchRect(ax + 14, b.y, aw - 28, 62, b.edge, 2, { fill: b.fill, tilt: 1.2 });
    s.text(ax + aw / 2, b.y + 27, b.label, 14, { bold: true });
    s.text(ax + aw / 2, b.y + 48, b.note, 11.5, { color: P.muted });
    right.push([ax + 14, b.y + 31]);
  }

  const labels = ['① 一直都在', '② 请求匹配', '③ 深入使用'];
  const lc = [P.amber, P.blue, P.green];
  for (let i = 0; i < 3; i++) {
    const [x1, y1] = left[i], [x2, y2] = right[i];
    s.arrow(x1, y1, x2, y2, lc[i], 2.2, { curve: i % 2 ? 6 : -6 });
    s.text((x1 + x2) / 2, Math.min(y1, y2) - 14, labels[i], 12.5, { color: lc[i], bold: true });
  }

  s.text(W / 2, 412, 'description 是函数签名，SKILL.md 是函数体，辅助文件是它引用的库', 13.5, { color: P.muted });
  return s.out();
}

// ---------- 图 2：流程图（一次请求触发 Skill 的链路） ----------
function flowSVG(P) {
  rnd = mulberry32(23);
  INK = P.ink;
  const W = 760, H = 376;
  const s = new SVG(W, H);
  s.raw(`<rect width="${W}" height="${H}" fill="${P.paper}"/>`);
  s.text(W / 2, 46, '一次请求触发 Skill 的完整链路', 21, { bold: true });

  s.sketchRect(36, 118, 124, 66, P.ink, 2.2, { fill: P.neutral, tilt: 1.4 });
  s.text(98, 146, '用户请求', 15, { bold: true });
  s.text(98, 168, '「帮我导出报表」', 11.5, { color: P.muted });

  const cx = 306, cy = 151, hw = 80, hh = 44;
  s.raw(`<rect x="${cx - hw + 4}" y="${cy - hh + 4}" width="${hw * 2 - 8}" height="${hh * 2 - 8}" rx="8" fill="${P.blueFill}"/>`);
  const pts = [[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy]];
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4];
    s.sketchLine(a[0], a[1], b[0], b[1], P.blue, 2.2, 1.2);
  }
  s.text(cx, cy - 4, '匹配某个', 13.5);
  s.text(cx, cy + 15, 'description？', 13.5, { bold: true, color: P.blue });

  s.arrow(cx, cy + hh, cx, 264, P.red, 2, { curve: -4 });
  s.text(cx + 16, 236, '否', 13, { color: P.red, bold: true, anchor: 'start' });
  s.sketchRect(228, 266, 156, 62, P.ink, 2, { fill: P.neutral, tilt: 1.2 });
  s.text(306, 294, '普通对话', 14.5, { bold: true });
  s.text(306, 314, '不带 Skill，直接回答', 11, { color: P.muted });

  s.arrow(cx + hw, cy, 468, cy, P.blue, 2.2, { curve: -6 });
  s.text(cx + hw + 22, cy - 12, '是', 13, { color: P.blue, bold: true });
  s.sketchRect(470, 118, 136, 66, P.blue, 2.2, { fill: P.blueFill, tilt: 1.3 });
  s.text(538, 146, '读 SKILL.md ①', 13.5, { bold: true });
  s.text(538, 168, '方法与步骤入口', 11, { color: P.muted });

  s.arrow(606, cy, 640, cy, P.ink, 2.2, { curve: -3 });
  s.sketchRect(642, 118, 108, 66, P.green, 2.2, { fill: P.greenFill, tilt: 1.3 });
  s.text(696, 143, '按需深入 ②', 13, { bold: true });
  s.text(696, 162, '读参考 /', 10.5, { color: P.muted });
  s.text(696, 176, '跑脚本', 10.5, { color: P.muted });

  s.arrow(696, 184, 696, 266, P.ink, 2.2, { curve: 4 });
  s.sketchRect(600, 268, 150, 64, P.amber, 2.2, { fill: P.amberFill, tilt: 1.3 });
  s.text(675, 294, '执行并回复 ③', 13.5, { bold: true });
  s.text(675, 314, '按 Skill 的方法做事', 10.5, { color: P.muted });

  s.arrow(392, 88, 344, 110, P.dash, 1.6, { dash: true, curve: 3 });
  s.text(400, 82, '匹配依据：启动时已常驻的 description', 12.5, { color: P.muted, anchor: 'start' });

  return s.out();
}

const outDir = path.resolve('public/images');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'skill-arch.svg'), archSVG(LIGHT));
fs.writeFileSync(path.join(outDir, 'skill-flow.svg'), flowSVG(LIGHT));
fs.writeFileSync(path.join(outDir, 'skill-arch-dark.svg'), archSVG(DARK));
fs.writeFileSync(path.join(outDir, 'skill-flow-dark.svg'), flowSVG(DARK));
console.log('generated:', fs.readdirSync(outDir).join(', '));
