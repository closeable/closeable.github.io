import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getAllPosts } from '../utils/posts';

export const GET: APIRoute = async (context) => {
  const posts = await getAllPosts();
  return rss({
    title: 'Lumen · 技术手记',
    description: '关注后端架构、分布式系统与工程实践。',
    site: context.site ?? 'https://example.com',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: [post.data.category, ...post.data.tags],
    })),
  });
};
