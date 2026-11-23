// 手绘风格 SVG 绘制库：抖动线条 + 双重描边模拟铅笔草图
// gen-sketch.mjs（skill 文章）与 gen-sketch-rag.mjs（RAG 文章）共用

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rnd = mulberry32(42);
export const seed = (a) => { rnd = mulberry32(a); };
export const j = (amp) => (rnd() * 2 - 1) * amp;

export function wobblyLine(x1, y1, x2, y2, amp = 1.6) {
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

export let INK = '#3f3a34';
export const setInk = (c) => { INK = c; };

export class SVG {
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

export const LIGHT = {
  paper: '#fffdf4', ink: '#3f3a34', muted: '#8a8378', neutral: '#f2eee2', dash: '#b3aca0',
  amber: '#c77b2e', amberFill: '#faeeda',
  blue: '#4a7ec2', blueFill: '#e6eefb',
  green: '#4e9a63', greenFill: '#e3f1e5',
  red: '#c25a4a',
};

export const DARK = {
  paper: '#1f1c17', ink: '#e9e3d5', muted: '#9a9287', neutral: '#2a2620', dash: '#6e6659',
  amber: '#d9a05c', amberFill: '#33291c',
  blue: '#7aa6e8', blueFill: '#1e2a3a',
  green: '#7dbb8f', greenFill: '#1e2f24',
  red: '#dd8a76',
};
