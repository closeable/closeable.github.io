import type { APIRoute } from 'astro';
import { getAllPosts } from '../utils/posts';
import { games } from '../data/games';
import { prompts } from '../data/prompts';
import { tools } from '../data/tools';

export const GET: APIRoute = async () => {
  const posts = await getAllPosts();

  const items = [
    ...posts.map((p) => ({
      title: p.data.title,
      desc: p.data.description,
      category: p.data.category,
      tags: p.data.tags,
      url: `/blog/${p.id}/`,
      type: '文章' as const,
    })),
    ...games.map((g) => ({
      title: g.title,
      desc: g.desc,
      category: g.tag,
      tags: [g.tag],
      url: `/games/${g.slug}/`,
      type: '游戏' as const,
    })),
    ...prompts.map((p) => ({
      title: p.title,
      desc: p.desc,
      category: p.category,
      tags: p.tags,
      url: `/prompts/#${p.id}`,
      type: '提示词' as const,
    })),
    ...tools.map((t) => ({
      title: t.name,
      desc: t.desc,
      category: t.category,
      tags: t.tags,
      url: `/tools/#${t.id}`,
      type: '工具' as const,
    })),
    { title: '首页', desc: '小天的AI作坊，技术手记与 AI 小游戏', category: '页面', tags: [], url: '/', type: '页面' as const },
    { title: '全部文章', desc: '按分类或标签筛选，搜索所有技术手记', category: '页面', tags: [], url: '/blog/', type: '页面' as const },
    { title: '小游戏合集', desc: '用 AI 做的轻松一刻，点开即玩', category: '页面', tags: [], url: '/games/', type: '页面' as const },
    { title: 'AI 提示词库', desc: '结构化提示词模板，按分类筛选、一键复制', category: '页面', tags: [], url: '/prompts/', type: '页面' as const },
    { title: '开源 AI 工具', desc: '精选开源 AI 项目，按分类筛选、直达 GitHub', category: '页面', tags: [], url: '/tools/', type: '页面' as const },
    { title: '产品', desc: '已经上线、能被人用起来的东西：微信小程序与网页小游戏，附状态与入口', category: '页面', tags: ['产品', '小程序', '小游戏'], url: '/products/', type: '页面' as const },
    { title: '养老金测算器', desc: '微信小程序：选城市、填年限，按官方公式测算退休后每月能领多少，支持方案保存与结果分享', category: '产品', tags: ['小程序', '工具', '养老金'], url: '/products/#pension-calculator', type: '产品' as const },
    { title: '创业专栏', desc: '一个人用 AI 做产品、上架、算账的过程记录：在做的项目、选题计划与复盘', category: '页面', tags: ['创业', '独立开发', '小程序'], url: '/startup/', type: '页面' as const },
    { title: 'AI 虚拟产品实战手册', desc: '选品、对标、封面标题、开店上架、数据复盘，10 章完整流程与判断标准', category: '创业', tags: ['虚拟产品', '小红书', '选品', '副业'], url: '/startup/handbook/', type: '页面' as const },
    { title: 'Chrome 插件实战手册', desc: '用 AI 写浏览器插件并上架收费：选需求、搭骨架、过审核、定价、获客与止损，附六个真实案例', category: '创业', tags: ['Chrome 插件', '浏览器扩展', 'AI 编程', '独立开发'], url: '/startup/plugin-handbook/', type: '页面' as const },
    { title: 'GEO 获客实战手册', desc: '让 AI 在被问到「哪家好」时说得出你：品牌诊断、事实台账、内容写法、信源投放、五层验证与止损节奏', category: '创业', tags: ['GEO', '生成式引擎优化', '获客', '品牌'], url: '/startup/geo-handbook/', type: '页面' as const },
    { title: '关于作坊', desc: '关于小天和这间作坊，含联系方式', category: '页面', tags: [], url: '/about/', type: '页面' as const },
  ];

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
