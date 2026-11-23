# Lumen · 技术手记

基于 Astro 的静态技术博客，支持 Markdown/MDX 文章、分类、标签、归档、全文筛选、目录、暗色模式和 RSS。

## 本地运行

```bash
npm install
npm run dev      # http://127.0.0.1:4321
npm run build    # 输出到 dist/
npm run preview  # 预览构建结果
npm run check    # 类型检查
```

## 写文章

在 `src/content/blog/` 下新建 `.md` 文件即可，frontmatter 字段：

```yaml
---
title: 文章标题
description: 一句话摘要
pubDate: 2026-11-23
updatedDate: 2026-11-24   # 可选
category: 架构            # 可选，默认「技术」
tags: [分布式, Go]        # 可选
featured: true            # 可选，首页精选
draft: false              # 可选，true 则不输出
---
```

发布前请把 `astro.config.mjs` 里的 `site` 改成真实域名。
