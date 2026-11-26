# sqtds · 技术手记

基于 Astro 的静态技术博客，支持 Markdown/MDX 文章、分类、标签、归档、全文筛选、目录、暗色模式和 RSS。

## 本地运行

```bash
npm install
npm run dev      # http://127.0.0.1:4321
npm run build    # 输出到 dist/
npm run preview  # 预览构建结果
npm run check    # 类型检查
```

## 部署

### 站点地址由环境变量决定

`astro.config.mjs` 的 `site` 读 `SITE_URL`，没设就回落到 `https://closeable.github.io`。
`sitemap`、`canonical`、`og:url`、`og:image`、`robots.txt` 全部跟着它走，换平台不用改代码：

```bash
SITE_URL=https://example.com npm run build
```

### 渠道一：GitHub Pages（默认，海外访问）

推送到 `source` 分支自动触发 Actions 构建，发布到 https://closeable.github.io 。
这个渠道国内不稳定，仅作备份与海外入口。

### 渠道二：腾讯云 EdgeOne Makers（国内主入口）

1. 控制台 → EdgeOne → Makers → 创建项目 → **导入 Git 仓库** → 选本仓库的 `source` 分支
2. 构建命令 `npm run build`，输出目录 `dist`，Node 版本 20 或以上
3. **加速区域选「全球（不含中国大陆）」**——这个选项决定绑自定义域名要不要备案：
   选它 = 免备案，走境外/香港节点；选「中国大陆」= 节点在国内但域名必须已备案
4. 首次部署先不设 `SITE_URL`，拿到分配的域名后，回到项目设置加环境变量
   `SITE_URL=https://你的域名`，再点一次部署
5. 之后每次推送 `source`，两个渠道同时更新

如果云端构建失败（Node 版本或依赖问题），改用「直接上传」：本地
`SITE_URL=https://你的域名 npm run build`，把 `dist/` 整个拖进去。
注意直接上传的项目之后无法切换成 Git 集成。

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

发布前不用改代码，用 `SITE_URL` 环境变量指定域名即可。
