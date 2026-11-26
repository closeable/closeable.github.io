/**
 * 产品清单：只放「能被别人真正用起来」的东西。
 * 上线了才写已上线，做不出来就老实写立项中，不给自己贴金。
 */

export interface Product {
  id: string;
  name: string;
  /** 一句话说清是干什么的 */
  tagline: string;
  platform: string;
  status: '已上线' | '开发中' | '立项中';
  desc: string;
  features: string[];
  /** 外部或站内入口 */
  href?: string;
  /** 小程序码，站点相对路径 */
  qr?: string;
  /** 相关文章 */
  article?: { href: string; label: string };
  date: string;
}

export const products: Product[] = [
  {
    id: 'pension-calculator',
    name: '养老金测算器',
    tagline: '选城市、填几年，算清退休后每月大概能领多少。',
    platform: '微信小程序',
    status: '已上线',
    desc: '官方公式太绕、参数不知道去哪查，这个小程序把它压成三个输入框：选城市、填已缴年限、挑未来缴费档次。剩下的社保数据可以拍一张权益单自动识别，也能手填。',
    features: [
      '内置 33 个主要城市的养老金计发基数，不用自己查社平工资',
      '拍社保权益单自动识别缴费年限与个人账户余额，识别失败可手填',
      '方案可保存、可对比，测算结果生成 5:4 分享卡片',
      '不申请定位等敏感权限；数据只存在你自己手机的本地存储里',
    ],
    qr: '/images/pension-miniprogram-qr.png',
    article: {
      href: '/blog/wechat-miniprogram-pension-calculator/',
      label: '看它是怎么被做出来的',
    },
    date: '2026-11',
  },
];

/** 还在路上的：写上，但标清楚不能当成品用 */
export const upcoming = [
  {
    name: '成语小程序',
    status: '立项中' as const,
    desc: '题库、答题、错题本，先做最小可用版本；主要卡在类目——游戏类目对个人基本关死，正在按工具类的形态重新设计。',
    href: '/startup/',
    label: '看立项记录',
  },
];
