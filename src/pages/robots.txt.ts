import type { APIRoute } from 'astro';

// 构建时按 astro.config.mjs 的 site 生成，换域名不用手改。
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://closeable.github.io');
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('sitemap-index.xml', base).href}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
