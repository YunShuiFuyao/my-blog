# 云海阁

云水扶摇的个人博客。纯静态、零构建，直接托管在 GitHub Pages 上。

界面走 Win10 / Fluent 的浅色路线：亚克力材质、克制的描边与内高光，背景是一片会跟随鼠标流动的彩色光晕。深色模式可一键切换。

> 尽我所能，敬我所不能。

- Bilibili：<https://space.bilibili.com/234841081>
- GitHub：<https://github.com/yunshuifuyao-ship-it/my-blog>

## 功能

- **首页与文章页分离**：`index.html` 只负责列表，文章在 `post.html?p=文件名.md`，可直接分享、刷新、在新标签页打开
- **入场动画**：印章 + 格言淡入，约 2 秒后揭开页面；点击 / 滚动 / 按键可立即跳过，同一会话只播放一次
- **Fluent 浅色主题**：亚克力模糊、分层阴影、卡片指针高光（Reveal）、噪点质感
- **跟随鼠标的彩色流光**：Canvas 绘制，带缓动与色相流动，自动适配明暗主题
- **文章搜索**：多关键词（空格分隔）、`#标签` 精确筛选、标题/摘要/正文加权排序、命中词高亮、正文摘录
- **标签筛选条**：标签从所有文章的 front matter 自动汇总并按数量排序，超过 12 个出现「更多 +N」可展开
- **快捷键**：`Ctrl / ⌘ + K` 聚焦搜索，`↑` `↓` 选择，`Enter` 打开，`Esc` 清空
- **阅读体验**：阅读进度条、阅读时长估算、代码块 / 表格 / 引用样式

## 目录

```
index.html              首页（列表 + 搜索 + 标签）
post.html               文章页（?p=文件名.md）
style.css               全部样式（设计令牌在文件顶部）
script.js               数据加载、搜索、路由、背景动画
assets/
  yun-brush.woff2       书法字体子集（仅含站点用到的字，4.8KB）
  OFL-MaShanZheng.txt   字体授权（SIL OFL 1.1）
posts/
  list.json             文章索引（由 GitHub Actions 自动生成）
  *.md                  文章
.github/workflows/auto-list.yml   推送 posts 后自动重建索引
.nojekyll               让 GitHub Pages 跳过 Jekyll（重要）
```

## 写一篇新文章

在 `posts/` 下新建 Markdown 文件，顶部写 front matter：

```markdown
---
title: 文章标题
description: 一句话简介，会显示在卡片上
date: 2026-05-30
tags: [前端, 设计]
---

正文从这里开始……
```

`description` 省略时会自动截取正文开头；`tags` 支持 `[a, b]` 或 `a, b` 两种写法。提交后工作流会更新 `list.json`，首页按日期倒序排列。

**加新标签不需要改代码**：标签直接来自每篇文章的 front matter，刷新后自动出现在筛选条里，并按文章数量排序。超过 12 个时折叠为「更多 +N」。

## 本地预览

直接双击 `index.html` 会被浏览器的本地文件策略拦截（`fetch` 读不到 `posts/`）。请在项目根目录起一个静态服务器：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 部署到 GitHub Pages

1. 推送到 `main` 分支（记得把 `assets/` 一起提交）；
2. 仓库 **Settings → Pages**，Source 选择 **Deploy from a branch**，分支 `main`、目录 `/ (root)`；
3. 等待 Actions 完成，访问 `https://<用户名>.github.io/my-blog/`。

页面用相对路径（`./posts/...`）读取数据，因此放在仓库子路径下也能正常工作；只有本地预览失败时才会回退到 `raw.githubusercontent.com`。

`.nojekyll` 必须保留：文章带有 front matter，Jekyll 会尝试把 `posts/*.md` 编译成页面，导致原始 Markdown 无法被前端读取。

## 自定义

- 改配色：`style.css` 顶部的 `html[data-theme="light"]` / `dark` 变量
- 改背景光晕：`script.js` 中 `initAurora()` 的 `orbs` 数组与 `paintOrb()` 参数
- 改标签折叠数量：`script.js` 中的 `TAG_LIMIT`
- 改入场动画时长：`style.css` 中 `.intro` 的 `animation` 延迟与 `initIntro()` 的兜底计时
- 改仓库地址：`script.js` 顶部的 `CONFIG`

书法字使用开源字体 **Ma Shan Zheng**（SIL OFL 1.1），已按站点用字裁剪为子集，授权文件见 `assets/OFL-MaShanZheng.txt`。若要显示新的汉字，需要重新生成子集，或把 `style.css` 里的 `--brush` 回退到系统楷体 / 行楷。
