/* ==========================================================================
   云海阁 · 构建脚本
   读取 posts/*.md → 生成静态文章页、索引、归档、标签、RSS、sitemap、404
   运行：npm run build
   ========================================================================== */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const POSTS_DIR = path.join(ROOT, "posts");
const OUT_DIR = ROOT;

marked.setOptions({ gfm: true, breaks: true });

/* 模板缺失时的内置兜底：即使没上传 templates/ 也能完成构建 */
const FALLBACK_TEMPLATES = {
    post: `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} · 云海阁</title>
    <meta name="description" content="{{DESCRIPTION}}">
    <link rel="canonical" href="{{CANONICAL}}">
    <meta name="theme-color" content="#f1f3f7">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="云海阁">
    <meta property="og:title" content="{{TITLE}} · 云海阁">
    <meta property="og:description" content="{{DESCRIPTION}}">
    <meta property="og:url" content="{{CANONICAL}}">
    <meta property="og:image" content="{{OG_IMAGE}}">
    <meta property="article:published_time" content="{{ISO_DATE}}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23c94b3f'/%3E%3Cstop offset='1' stop-color='%239a2721'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cpath d='M20 42a8 8 0 0 1 .8-15.96 11 11 0 0 1 21.2 2.2A7.5 7.5 0 0 1 44 42z' fill='white' opacity='.96'/%3E%3C/svg%3E">
    <link rel="alternate" type="application/rss+xml" title="云海阁" href="../../feed.xml">
    <link rel="preload" href="../../assets/yun-brush.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="../../style.css">
</head>
<body data-page="post-static">
    <canvas id="bg-canvas" aria-hidden="true"></canvas>
    <div class="grain" aria-hidden="true"></div>
    <div class="reading-progress" id="reading-progress" aria-hidden="true"><span></span></div>

    <div class="app">
        <header class="navbar" id="navbar">
            <div class="nav-inner">
                <a class="brand" href="../../index.html" aria-label="云海阁 · 返回首页">
                    <span class="brand-mark" aria-hidden="true">云</span>
                    <span class="brand-text">云海阁</span>
                </a>
                <nav class="nav-links" aria-label="主导航">
                    <a class="nav-link" href="../../index.html">首页</a>
                    <a class="nav-link" href="../../archive.html">归档</a>
                    <a class="nav-link" href="https://space.bilibili.com/234841081" target="_blank" rel="noopener">B站</a>
                    <a class="nav-link" href="https://github.com/yunshuifuyao-ship-it/my-blog" target="_blank" rel="noopener">GitHub</a>
                    <button class="theme-btn" id="theme-toggle" type="button" aria-label="切换深色模式" title="切换深色模式">
                        <svg class="icon-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                            <circle cx="12" cy="12" r="4.2"></circle>
                            <path d="M12 2.2v2.1M12 19.7v2.1M2.2 12h2.1M19.7 12h2.1M5.1 5.1l1.5 1.5M17.4 17.4l1.5 1.5M18.9 5.1l-1.5 1.5M6.6 17.4l-1.5 1.5"></path>
                        </svg>
                        <svg class="icon-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7z"></path>
                        </svg>
                    </button>
                </nav>
            </div>
        </header>

        <main class="container">
            <div class="article-toolbar article-toolbar--wide">
                <a class="btn-back" href="../../index.html">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M15 5l-7 7 7 7"></path>
                    </svg>
                    返回列表
                </a>
                <button class="btn-ghost" id="copy-link" type="button">复制链接</button>
            </div>

            {{TOC_MOBILE}}

            <div class="post-layout{{LAYOUT_CLASS}}">
                <article id="article-detail" class="article-surface markdown-body">
                    <header class="article-header">
                        <h1>{{TITLE}}</h1>
                        <div class="article-meta">
                            <span class="meta-item">{{DATE_ICON}}{{DATE}}</span>
                            <span class="meta-sep"></span>
                            <span class="meta-item">{{CLOCK_ICON}}{{READING}} 分钟阅读</span>
                        </div>
                        {{TAGS}}
                    </header>
                    {{CONTENT}}
                    {{PREV_NEXT}}
                </article>

                {{TOC_ASIDE}}
            </div>

            <section class="comments" id="comments" aria-label="评论">
                <h2 class="comments-title">评论</h2>
                <p class="comments-hint">使用 GitHub 账号登录后即可留言，评论会同步到仓库的 Issues。</p>
                <div class="utterances"></div>
                <script src="https://utteranc.es/client.js"
                        repo="yunshuifuyao-ship-it/my-blog"
                        issue-term="pathname"
                        label="comment"
                        theme="github-light"
                        crossorigin="anonymous"
                        async>
                </script>
            </section>
        </main>

        <footer class="site-footer">
            <div class="footer-links">
                <a href="https://space.bilibili.com/234841081" target="_blank" rel="noopener">Bilibili</a>
                <a href="https://github.com/yunshuifuyao-ship-it/my-blog" target="_blank" rel="noopener">GitHub</a>
                <a href="../../archive.html">归档</a>
                <a href="../../tags.html">标签</a>
                <a href="../../feed.xml">RSS</a>
            </div>
            <p>© <span id="year">2026</span> 云水扶摇 · 在这个世界有一束光，就能为任何人照亮</p>
        </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js" defer></script>
    <script src="../../script.js"></script>
</body>
</html>
`,
    page: `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <meta name="description" content="{{DESCRIPTION}}">
    <link rel="canonical" href="{{CANONICAL}}">
    <meta name="theme-color" content="#f1f3f7">
    <meta property="og:type" content="{{OG_TYPE}}">
    <meta property="og:site_name" content="云海阁">
    <meta property="og:title" content="{{TITLE}}">
    <meta property="og:description" content="{{DESCRIPTION}}">
    <meta property="og:url" content="{{CANONICAL}}">
    <meta property="og:image" content="{{OG_IMAGE}}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23c94b3f'/%3E%3Cstop offset='1' stop-color='%239a2721'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cpath d='M20 42a8 8 0 0 1 .8-15.96 11 11 0 0 1 21.2 2.2A7.5 7.5 0 0 1 44 42z' fill='white' opacity='.96'/%3E%3C/svg%3E">
    <link rel="alternate" type="application/rss+xml" title="云海阁" href="{{ROOT}}feed.xml">
    <link rel="preload" href="{{ROOT}}assets/yun-brush.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="{{ROOT}}style.css">
</head>
<body data-page="{{PAGE}}">
    <canvas id="bg-canvas" aria-hidden="true"></canvas>
    <div class="grain" aria-hidden="true"></div>
    <div class="reading-progress" id="reading-progress" aria-hidden="true"><span></span></div>

    <div class="app">
        <header class="navbar" id="navbar">
            <div class="nav-inner">
                <a class="brand" href="{{ROOT}}index.html" aria-label="云海阁 · 返回首页">
                    <span class="brand-mark" aria-hidden="true">云</span>
                    <span class="brand-text">云海阁</span>
                </a>
                <nav class="nav-links" aria-label="主导航">
                    <a class="nav-link" href="{{ROOT}}index.html">首页</a>
                    <a class="nav-link" href="{{ROOT}}archive.html">归档</a>
                    <a class="nav-link" href="https://space.bilibili.com/234841081" target="_blank" rel="noopener">B站</a>
                    <a class="nav-link" href="https://github.com/yunshuifuyao-ship-it/my-blog" target="_blank" rel="noopener">GitHub</a>
                    <button class="theme-btn" id="theme-toggle" type="button" aria-label="切换深色模式" title="切换深色模式">
                        <svg class="icon-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                            <circle cx="12" cy="12" r="4.2"></circle>
                            <path d="M12 2.2v2.1M12 19.7v2.1M2.2 12h2.1M19.7 12h2.1M5.1 5.1l1.5 1.5M17.4 17.4l1.5 1.5M18.9 5.1l-1.5 1.5M6.6 17.4l-1.5 1.5"></path>
                        </svg>
                        <svg class="icon-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7z"></path>
                        </svg>
                    </button>
                </nav>
            </div>
        </header>

        <main class="container">
{{BODY}}
        </main>

        <footer class="site-footer">
            <div class="footer-links">
                <a href="https://space.bilibili.com/234841081" target="_blank" rel="noopener">Bilibili</a>
                <a href="https://github.com/yunshuifuyao-ship-it/my-blog" target="_blank" rel="noopener">GitHub</a>
                <a href="{{ROOT}}archive.html">归档</a>
                <a href="{{ROOT}}tags.html">标签</a>
                <a href="{{ROOT}}feed.xml">RSS</a>
            </div>
            <p>© <span id="year">2026</span> 云水扶摇 · 在这个世界有一束光，就能为任何人照亮</p>
        </footer>
    </div>

    <script src="{{ROOT}}script.js"></script>
</body>
</html>
`
};

function loadTemplate(name) {
    const file = path.join(ROOT, "templates", `${name}.html`);
    if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
    console.warn(`templates/${name}.html 不存在，使用内置模板`);
    return FALLBACK_TEMPLATES[name];
}


/* ---------- 通用 ---------- */
const ICON = {
    calendar: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"></rect><path d="M8 3v4M16 3v4M3.5 10h17"></path></svg>',
    clock: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg>'
};

const escapeHtml = (value) =>
    String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

const stripTags = (html) => html.replace(/<[^>]+>/g, "").trim();

function read(file) {
    return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function write(file, content) {
    const target = path.join(OUT_DIR, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
}

function fill(template, vars) {
    let out = template;
    for (const [key, value] of Object.entries(vars)) {
        out = out.split(`{{${key}}}`).join(value == null ? "" : String(value));
    }
    return out;
}

/* ---------- Front matter ---------- */
function parseFrontMatter(raw, fallbackTitle) {
    const meta = { title: fallbackTitle, date: "", description: "", tags: [] };
    let body = raw;
    const match = raw.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);

    if (match) {
        body = raw.slice(match[0].length);
        for (const line of match[1].split(/\r?\n/)) {
            const idx = line.indexOf(":");
            if (idx < 1) continue;
            const key = line.slice(0, idx).trim().toLowerCase();
            let value = line.slice(idx + 1).trim();
            if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);

            if (key === "title" && value) meta.title = value;
            else if (key === "date" && value) meta.date = value;
            else if ((key === "description" || key === "summary" || key === "excerpt") && value) meta.description = value;
            else if (key === "tags") {
                meta.tags = value
                    .replace(/^\[|\]$/g, "")
                    .split(/[,，、]/)
                    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, "").replace(/^#/, ""))
                    .filter(Boolean);
            }
        }
    }
    return { meta, body };
}

/* ---------- 文本处理 ---------- */
function toPlainText(markdown) {
    return markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/~~~[\s\S]*?~~~/g, " ")
        .replace(/`[^`\n]*`/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/^\s{0,3}#{1,6}\s+/gm, "")
        .replace(/^\s{0,3}>\s?/gm, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/[*_~]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function readingTime(plain) {
    const cjk = (plain.match(/[\u3400-\u9fff]/g) || []).length;
    const words = (plain.replace(/[\u3400-\u9fff]/g, " ").match(/[A-Za-z0-9_'-]+/g) || []).length;
    return Math.max(1, Math.round(cjk / 400 + words / 220));
}

function tease(text, length = 88) {
    if (!text) return "";
    return text.length > length ? `${text.slice(0, length)}…` : text;
}

function parseDate(value) {
    const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(String(value || "").trim());
    if (match) {
        return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], 4));
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date(Date.UTC(2026, 0, 1)) : date;
}

function formatDate(date) {
    return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

function isoDate(date) {
    return date.toISOString().slice(0, 10);
}

function rfcDate(date) {
    return date.toUTCString();
}

/* ---------- Markdown 渲染 ---------- */
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/g, "-")
        .slice(0, 60) || "section";
}

function renderMarkdown(markdown) {
    let html = marked.parse(markdown);
    const headings = [];
    const seen = new Map();

    html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (full, level, inner) => {
        const text = stripTags(inner).trim();
        let id = slugify(text);
        const count = (seen.get(id) || 0) + 1;
        seen.set(id, count);
        if (count > 1) id = `${id}-${count}`;
        headings.push({ level: Number(level), id, text });
        return `<h${level} id="${id}">${inner}</h${level}>`;
    });

    html = html.replace(/<img /g, '<img loading="lazy" ');
    return { html, headings };
}

function buildTocLinks(headings) {
    return headings
        .map((h) => `<li class="toc-item toc-h${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`)
        .join("");
}

/* ---------- 页面片段 ---------- */
function articleTags(post, rootPrefix) {
    if (!post.tags.length) return "";
    return `<div class="article-tags">
        ${post.tags.map((tag) => `<a class="tag" href="${rootPrefix}index.html?tag=${encodeURIComponent(tag)}">${escapeHtml(tag)}</a>`).join("")}
    </div>`;
}

function prevNext(post, newer, older) {
    if (!newer && !older) return "";
    const link = (item, direction, label) => item
        ? `<a class="prev-next-link prev-next-${direction}" href="../../${item.url}">
               <span class="prev-next-label">${label}</span>
               <span class="prev-next-title">${escapeHtml(item.title)}</span>
           </a>`
        : `<span class="prev-next-link is-empty"></span>`;

    return `<nav class="prev-next" aria-label="上一篇 / 下一篇">
        ${link(newer, "newer", "← 更新的一篇")}
        ${link(older, "older", "更早的一篇 →")}
    </nav>`;
}

/* ---------- 主流程 ---------- */
function build() {
    // post/ 完全是生成物，先清空，避免删除文章后残留旧页面
    fs.rmSync(path.join(ROOT, "post"), { recursive: true, force: true });

    const files = fs.readdirSync(POSTS_DIR).filter((file) => /\.md$/i.test(file)).sort();
    const posts = [];

    for (const file of files) {
        const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
        const fallbackTitle = file.replace(/\.md$/i, "");
        const { meta, body } = parseFrontMatter(raw, fallbackTitle);
        // 页头已经有大标题，正文开头的 H1 去掉，避免重复
        const contentBody = body.replace(/^\s*#\s+[^\n]*(?:\r?\n)+/, "");
        const { html, headings } = renderMarkdown(contentBody);
        const plain = toPlainText(contentBody);
        const date = parseDate(meta.date);
        const slug = file.replace(/\.md$/i, "");

        posts.push({
            file,
            slug,
            url: `post/${encodeURIComponent(slug)}/`,
            title: meta.title || fallbackTitle,
            description: meta.description || tease(plain, 76),
            dateText: meta.date || isoDate(date),
            date,
            tags: meta.tags,
            html,
            headings,
            plain,
            reading: readingTime(plain)
        });
    }

    posts.sort((a, b) => b.date - a.date);

    const postTemplate = loadTemplate("post");
    const pageTemplate = loadTemplate("page");
    const ogImage = `${config.baseUrl}/${encodeURIComponent("头像.jpeg")}`;

    /* 文章页 */
    posts.forEach((post, index) => {
        const tocLinks = buildTocLinks(post.headings);
        const hasToc = post.headings.length > 0;
        const newer = posts[index - 1];
        const older = posts[index + 1];
        const canonical = `${config.baseUrl}/${post.url}`;

        const page = fill(postTemplate, {
            TITLE: escapeHtml(post.title),
            DESCRIPTION: escapeHtml(post.description),
            CANONICAL: canonical,
            OG_IMAGE: ogImage,
            ISO_DATE: isoDate(post.date),
            DATE: formatDate(post.date),
            READING: post.reading,
            TAGS: articleTags(post, "../../"),
            CONTENT: post.html,
            PREV_NEXT: prevNext(post, newer, older),
            DATE_ICON: ICON.calendar,
            CLOCK_ICON: ICON.clock,
            LAYOUT_CLASS: hasToc ? "" : " post-layout--single",
            TOC_ASIDE: hasToc
                ? `<aside class="toc" aria-label="文章目录">
                       <p class="toc-title">目录</p>
                       <ol class="toc-list">${tocLinks}</ol>
                   </aside>`
                : "",
            TOC_MOBILE: hasToc
                ? `<details class="toc-mobile">
                       <summary>目录 · ${post.headings.length} 节</summary>
                       <ol class="toc-list">${tocLinks}</ol>
                   </details>`
                : ""
        });

        write(path.join("post", post.slug, "index.html"), page);
    });

    /* 索引 */
    const index = posts.map((post) => ({
        file: post.file,
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.dateText,
        tags: post.tags,
        url: post.url,
        reading: post.reading,
        plain: post.plain
    }));
    write("posts/index.json", `${JSON.stringify(index, null, 2)}\n`);
    write("posts/list.json", `${JSON.stringify(files, null, 2)}\n`);

    /* 归档 */
    const byYear = new Map();
    posts.forEach((post) => {
        const year = String(post.date.getUTCFullYear());
        if (!byYear.has(year)) byYear.set(year, []);
        byYear.get(year).push(post);
    });

    const archiveBody = `
        <section class="page-head">
            <h1>归档</h1>
            <p>共 ${posts.length} 篇，按时间倒序。</p>
        </section>
        <div class="archive">
            ${[...byYear.entries()].map(([year, items]) => `
                <section class="archive-year">
                    <h2>${year}</h2>
                    <ul>
                        ${items.map((post) => `
                            <li>
                                <a href="${post.url}">${escapeHtml(post.title)}</a>
                                <time datetime="${isoDate(post.date)}">${post.date.getUTCMonth() + 1} 月 ${post.date.getUTCDate()} 日</time>
                            </li>`).join("")}
                    </ul>
                </section>`).join("")}
        </div>
        <p class="archive-more"><a href="tags.html">按标签浏览 →</a></p>
    `;

    write("archive.html", fill(pageTemplate, {
        ROOT: "",
        PAGE: "page",
        TITLE: "归档 · 云海阁",
        DESCRIPTION: "云海阁的全部文章，按时间倒序。",
        CANONICAL: `${config.baseUrl}/archive.html`,
        OG_TYPE: "website",
        OG_IMAGE: ogImage,
        BODY: archiveBody
    }));

    /* 标签 */
    const counts = new Map();
    posts.forEach((post) => post.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
    const tagList = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans-CN"));

    const tagsBody = `
        <section class="page-head">
            <h1>标签</h1>
            <p>${tagList.length} 个标签，共 ${posts.length} 篇文章。</p>
        </section>
        <div class="tag-cloud">
            ${tagList.map(([tag, count]) => `
                <a class="tag-cloud-item" href="index.html?tag=${encodeURIComponent(tag)}">
                    ${escapeHtml(tag)}<em>${count}</em>
                </a>`).join("")}
        </div>
        <p class="archive-more"><a href="archive.html">按时间浏览 →</a></p>
    `;

    write("tags.html", fill(pageTemplate, {
        ROOT: "",
        PAGE: "page",
        TITLE: "标签 · 云海阁",
        DESCRIPTION: "云海阁的全部标签。",
        CANONICAL: `${config.baseUrl}/tags.html`,
        OG_TYPE: "website",
        OG_IMAGE: ogImage,
        BODY: tagsBody
    }));

    /* RSS */
    const feedItems = posts.map((post) => `
        <item>
            <title>${escapeHtml(post.title)}</title>
            <link>${config.baseUrl}/${post.url}</link>
            <guid isPermaLink="true">${config.baseUrl}/${post.url}</guid>
            <pubDate>${rfcDate(post.date)}</pubDate>
            <description>${escapeHtml(post.description)}</description>
        </item>`).join("");

    write("feed.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>${escapeHtml(config.siteTitle)}</title>
        <link>${config.baseUrl}/</link>
        <description>${escapeHtml(config.description)}</description>
        <language>zh-CN</language>
        <lastBuildDate>${rfcDate(posts[0] ? posts[0].date : new Date())}</lastBuildDate>
        <atom:link href="${config.baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
        ${feedItems}
    </channel>
</rss>
`);

    /* sitemap */
    const urls = [
        { loc: `${config.baseUrl}/`, lastmod: posts[0] ? isoDate(posts[0].date) : "" },
        { loc: `${config.baseUrl}/archive.html`, lastmod: "" },
        { loc: `${config.baseUrl}/tags.html`, lastmod: "" },
        ...posts.map((post) => ({ loc: `${config.baseUrl}/${post.url}`, lastmod: isoDate(post.date) }))
    ];

    write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `    <url><loc>${url.loc}</loc>${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`);

    /* 404 */
    const basePath = new URL(config.baseUrl).pathname.replace(/\/$/, "");
    write("404.html", fill(pageTemplate, {
        ROOT: `${basePath}/`,
        PAGE: "page",
        TITLE: "页面没有找到 · 云海阁",
        DESCRIPTION: "这一页已经飘走了。",
        CANONICAL: `${config.baseUrl}/404.html`,
        OG_TYPE: "website",
        OG_IMAGE: ogImage,
        BODY: `
        <section class="notfound">
            <p class="notfound-code">404</p>
            <h1>这一页飘走了</h1>
            <p class="notfound-sub">它可能被挪走、改了名字，或者从来就没有存在过。</p>
            <a class="state-action" href="${basePath}/">回到云海阁</a>
        </section>`
    }));

    console.log(`构建完成：${posts.length} 篇文章`);
    posts.forEach((post) => console.log(`  · ${post.title} → /${post.url}`));
    console.log("  生成：posts/index.json、archive.html、tags.html、feed.xml、sitemap.xml、404.html");
}

build();
