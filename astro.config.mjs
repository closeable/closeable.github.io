import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// 站点根地址。默认走 GitHub Pages；在其他平台部署时用环境变量覆盖，
// 保证 sitemap / canonical / og:url 都指向用户实际打开的那个域名。
//   例：SITE_URL=https://xxx.edgeone.app npm run build
const site = process.env.SITE_URL || 'https://closeable.github.io';

export default defineConfig({
  site,
  integrations: [mdx(), sitemap()],
});
