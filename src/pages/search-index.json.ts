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
    { title: '归档', desc: '按时间线浏览所有文章', category: '页面', tags: [], url: '/archives/', type: '页面' as const },
    { title: '关于作坊', desc: '关于小天和这间作坊，含联系方式', category: '页面', tags: [], url: '/about/', type: '页面' as const },
  ];

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
