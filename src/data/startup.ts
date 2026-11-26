/**
 * 创业专栏的数据：在做的项目、选题计划、栏目定位。
 * 原则：只写自己动手做过的事、带真实数字、包括失败部分。不写「低成本高利润」这类爽文。
 */

export interface Project {
  id: string;
  name: string;
  status: string;
  /** 0-100，粗粒度进度，只做示意 */
  progress: number;
  desc: string;
  stack: string[];
  note: string;
  updated: string;
}

export interface Topic {
  title: string;
  desc: string;
  status: '已发布' | '写作中' | '计划中';
  url?: string;
}

export const principles = [
  '只写自己真正动手做过的事，不搬别人总结的「方法论」。',
  '能给数字就给数字：花了多少钱、用了多少天、卖出几单。',
  '失败和放弃的部分照实写，那才是别人最需要看的东西。',
];

export const projects: Project[] = [
  {
    id: 'idiom-miniapp',
    name: '成语小程序',
    status: '立项中',
    progress: 15,
    desc: '一个用 AI 辅助开发的成语类微信小程序：题库、答题、错题本，先做最小可用版本。目标是走完从立项、类目选择、开发到审核上架的全流程。',
    stack: ['微信小程序', '云开发', 'AI 辅助编码'],
    note: '正在确认个人主体能走通哪条路——游戏类目对个人基本关死，所以先按工具类目设计产品形态。',
    updated: '2026-11',
  },
];

export const topics: Topic[] = [
  {
    title: '成语小程序：从立项到上架，每一步都记下来',
    desc: '选题怎么定的、类目怎么选的、哪些资质卡人、审核提了几次。',
    status: '写作中',
  },
  {
    title: '一个人的产品要花多少钱：逐项算给你看',
    desc: '域名、静态托管、小程序认证、云开发额度，把能省的和省不掉的分开列。',
    status: '计划中',
  },
  {
    title: 'AI 做的小游戏，怎么免费放到网上给人玩',
    desc: '不买服务器、不备案也能分享链接的做法，以及踩过的坑。',
    status: '计划中',
  },
  {
    title: '审核被驳回之后，我到底改了什么',
    desc: '驳回理由原文、我理解错在哪、第二次提交改了什么。',
    status: '计划中',
  },
  {
    title: '那些「成本 20 卖 399」的副业，我实际试了哪个',
    desc: '不评价别人，只说自己下场试的结果和真实成本。',
    status: '计划中',
  },
];
