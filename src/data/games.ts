export interface Game {
  slug: string;       // 游戏文件位于 public/play/<slug>/index.html
  title: string;
  emoji: string;      // 卡片封面
  desc: string;
  tag: string;
  date: string;       // 展示用，YYYY-MM-DD
}

// 新增游戏：1) 把单文件 HTML 放到 public/play/<slug>/index.html
//          2) 在下面数组里加一条即可
export const games: Game[] = [
  {
    slug: 'snake',
    title: '霓虹贪吃蛇',
    emoji: '🐍',
    desc: '经典贪吃蛇的霓虹重制版。方向键 / WASD / 触屏滑动操控，吃豆子变长，撞墙或咬到自己即结束，本地记录最高分。',
    tag: '街机',
    date: '2026-11-24',
  },
];
