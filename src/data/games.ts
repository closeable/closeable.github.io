export interface Game {
  slug: string;       // 游戏文件位于 public/play/<slug>/index.html
  title: string;
  emoji: string;      // 卡片封面（无 cover 时使用）
  cover?: string;     // 可选：卡片封面图，位于 /play/<slug>/xxx.png
  aspect?: string;    // 可选：播放页 iframe 宽高比，默认 4 / 3
  desc: string;
  tag: string;
  date: string;       // 展示用，YYYY-MM-DD
}

// 新增游戏：1) 把单文件 HTML 放到 public/play/<slug>/index.html
//          2) 在下面数组里加一条即可
export const games: Game[] = [
  {
    slug: 'devour-planet',
    title: '吞噬星球',
    emoji: '🌍',
    cover: '/play/devour-planet/preview.png',
    desc: 'agar.io 式成长竞技：鼠标或 WASD 控制细胞，吃掉比自己小的粒子不断变大，躲开比你大的家伙——长大只是暂时的，被吞噬才是常态。R 键随时重开。',
    tag: '竞技',
    aspect: '16 / 10',
    date: '2026-11-24',
  },
  {
    slug: 'jump',
    title: '霓虹跳跃',
    emoji: '🏃',
    desc: '无尽跑酷躲避：空格 / ↑ / 触屏点击跳跃，长按跳更高，空中还能二段跳。躲开地刺和飞鸟，速度会越跑越快，本地记录最高分。',
    tag: '跑酷',
    aspect: '2 / 1',
    date: '2026-11-24',
  },
  {
    slug: 'snake',
    title: '霓虹贪吃蛇',
    emoji: '🐍',
    desc: '经典贪吃蛇的霓虹重制版。方向键 / WASD / 触屏滑动操控，吃豆子变长，撞墙或咬到自己即结束，本地记录最高分。',
    tag: '街机',
    aspect: '1 / 1',
    date: '2026-11-24',
  },
];
