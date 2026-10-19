/* ==========================================================================
   云海阁 · Script
   1. 配置与工具    2. 主题      3. 流光背景    4. 数据
   5. 首页          6. 搜索      7. 标签        8. 文章页
   9. 公共交互      10. 启动
   ========================================================================== */

/* ==================== 1. 配置与工具 ==================== */
const CONFIG = {
    username: "yunshuifuyao-ship-it",
    repo: "my-blog",
    branch: "main",
    folder: "posts"
};

const PAGE = document.body.dataset.page || "home";
const LOCAL_BASE = CONFIG.folder;
// jsDelivr 镜像 GitHub 原始文件，国内网络通常比 raw.githubusercontent.com 更容易访问
const CDN_BASE = `https://cdn.jsdelivr.net/gh/${CONFIG.username}/${CONFIG.repo}@${CONFIG.branch}/${CONFIG.folder}`;
const REMOTE_BASE = `https://raw.githubusercontent.com/${CONFIG.username}/${CONFIG.repo}/${CONFIG.branch}/${CONFIG.folder}`;
const THEME_KEY = "yunhai-theme";
const INTRO_KEY = "yunhai-intro-seen";

const state = {
    posts: [],
    base: LOCAL_BASE,
    query: "",
    tokens: [],
    matchTokens: [],
    activeIndex: -1,
    loading: true,
    articleReady: false,
    tagExpanded: false
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function debounce(fn, wait = 120) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

const ICON = {
    calendar: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"></rect><path d="M8 3v4M16 3v4M3.5 10h17"></path></svg>',
    clock: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg>',
    tag: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5V5.5A1.5 1.5 0 0 1 5.5 4h5l9 9-6.5 6.5z"></path><circle cx="8" cy="8" r="1.4"></circle></svg>'
};

/* ==================== 2. 日期与文本 ==================== */
function parseFrontMatter(rawText, fallbackTitle) {
    const meta = { title: fallbackTitle, date: "", description: "", tags: [] };
    let body = rawText;
    const match = rawText.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);

    if (match) {
        body = rawText.slice(match[0].length);
        match[1].split(/\r?\n/).forEach((line) => {
            const idx = line.indexOf(":");
            if (idx < 1) return;
            const key = line.slice(0, idx).trim().toLowerCase();
            let value = line.slice(idx + 1).trim();
            const quoted = /^(['"])([\s\S]*)\1$/.exec(value);
            if (quoted) value = quoted[2];

            if (key === "title" && value) meta.title = value;
            else if (key === "date" && value) meta.date = value;
            else if ((key === "description" || key === "summary" || key === "excerpt") && value) meta.description = value;
            else if (key === "tags") meta.tags = parseTags(value);
        });
    }
    return { meta, body };
}

function parseTags(value) {
    return value
        .replace(/^\[|\]$/g, "")
        .split(/[,，、]/)
        .map((tag) => tag.trim().replace(/^['"]|['"]$/g, "").replace(/^#/, ""))
        .filter(Boolean);
}

function parseDate(value) {
    if (!value) return null;
    const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(String(value).trim());
    if (match) return new Date(+match[1], +match[2] - 1, +match[3]);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
    if (!date) return "未标注日期";
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

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

function readingTime(markdown) {
    const text = toPlainText(markdown);
    const cjk = (text.match(/[\u3400-\u9fff]/g) || []).length;
    const words = (text.replace(/[\u3400-\u9fff]/g, " ").match(/[A-Za-z0-9_'-]+/g) || []).length;
    return Math.max(1, Math.round(cjk / 400 + words / 220));
}

function teaser(text, length = 88) {
    if (!text) return "";
    return text.length > length ? `${text.slice(0, length)}…` : text;
}

/* ==================== 3. 主题 ==================== */
function initTheme() {
    const root = document.documentElement;
    const button = $("#theme-toggle");
    const saved = localStorage.getItem(THEME_KEY);
    const initial = saved === "dark" || saved === "light" ? saved : "light";

    applyTheme(initial);

    button.addEventListener("click", () => {
        applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
    });

    function applyTheme(theme) {
        root.dataset.theme = theme;
        localStorage.setItem(THEME_KEY, theme);
        const dark = theme === "dark";
        button.setAttribute("aria-label", dark ? "切换浅色模式" : "切换深色模式");
        button.title = dark ? "切换浅色模式" : "切换深色模式";
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", dark ? "#0d0f13" : "#f1f3f7");
        syncCommentsTheme();
    }
}

/* ==================== 4. 跟随鼠标的彩色流光 ==================== */
function initAurora() {
    const canvas = $("#bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;

    const pointer = {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.35,
        tx: window.innerWidth * 0.5,
        ty: window.innerHeight * 0.35,
        moved: false
    };

    const orbs = [
        { ax: 0.18, ay: 0.22, r: 0.46, hue: 210, amp: 0.085, speed: 0.00021, phase: 0.0 },
        { ax: 0.82, ay: 0.18, r: 0.40, hue: 272, amp: 0.07, speed: 0.00028, phase: 1.7 },
        { ax: 0.74, ay: 0.80, r: 0.46, hue: 328, amp: 0.08, speed: 0.00017, phase: 3.1 },
        { ax: 0.22, ay: 0.82, r: 0.40, hue: 166, amp: 0.09, speed: 0.00024, phase: 4.4 },
        { ax: 0.52, ay: 0.46, r: 0.34, hue: 236, amp: 0.075, speed: 0.00014, phase: 2.4 }
    ];

    // 缓慢上升的微光粒子，让背景始终“在动”
    const motes = Array.from({ length: 28 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 0.8 + Math.random() * 1.8,
        speed: 0.002 + Math.random() * 0.006,
        sway: 6 + Math.random() * 20,
        phase: Math.random() * Math.PI * 2,
        hue: 190 + Math.random() * 120,
        alpha: 0.16 + Math.random() * 0.34
    }));

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        if (reduceMotion) draw(9000);
    }

    function paintOrb(x, y, radius, hue, dark, boost = 1) {
        const sat = dark ? 84 : 78;
        const light = dark ? 56 : 68;
        const alpha = Math.min(0.2 * boost, 0.5);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`);
        gradient.addColorStop(0.42, `hsla(${hue}, ${sat}%, ${light}%, ${alpha * 0.38})`);
        gradient.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function draw(time) {
        const dark = document.documentElement.dataset.theme === "dark";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = dark ? "#0d0f13" : "#f1f3f7";
        ctx.fillRect(0, 0, width, height);

        // 顶部一层柔和的环境光，让页面有 Fluent 的纵深
        const sheen = ctx.createLinearGradient(0, 0, 0, height * 0.55);
        sheen.addColorStop(0, dark ? "rgba(58, 78, 132, 0.30)" : "rgba(255, 255, 255, 0.72)");
        sheen.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = sheen;
        ctx.fillRect(0, 0, width, height * 0.55);

        ctx.globalCompositeOperation = dark ? "lighter" : "source-over";

        const base = Math.max(width, height);
        orbs.forEach((orb) => {
            const x = width * orb.ax + Math.sin(time * orb.speed + orb.phase) * width * orb.amp;
            const y = height * orb.ay + Math.cos(time * orb.speed * 1.27 + orb.phase) * height * orb.amp * 1.1;
            const hue = orb.hue + Math.sin(time * 0.00004 + orb.phase) * 16;
            paintOrb(x, y, base * orb.r, hue, dark);
        });

        // 给中间留一块安静的区域，保证正文与卡片的可读性
        ctx.globalCompositeOperation = "source-over";
        const veil = ctx.createRadialGradient(
            width * 0.5, height * 0.42, 0,
            width * 0.5, height * 0.42, Math.max(width, height) * (dark ? 0.9 : 0.62)
        );
        if (dark) {
            veil.addColorStop(0, "rgba(13, 15, 19, 0.62)");
            veil.addColorStop(0.5, "rgba(13, 15, 19, 0.36)");
            veil.addColorStop(1, "rgba(13, 15, 19, 0)");
        } else {
            veil.addColorStop(0, "rgba(247, 249, 252, 0.62)");
            veil.addColorStop(0.55, "rgba(247, 249, 252, 0.34)");
            veil.addColorStop(1, "rgba(247, 249, 252, 0)");
        }
        ctx.fillStyle = veil;
        ctx.fillRect(0, 0, width, height);

        // 跟随指针的主光晕：缓动 + 色相缓慢流动
        if (!pointer.moved && !reduceMotion) {
            pointer.tx = width * 0.5 + Math.sin(time * 0.00022) * width * 0.12;
            pointer.ty = height * 0.34 + Math.cos(time * 0.00018) * height * 0.08;
        }
        pointer.x += (pointer.tx - pointer.x) * 0.075;
        pointer.y += (pointer.ty - pointer.y) * 0.075;

        // 微光粒子
        const seconds = time / 1000;
        motes.forEach((mote) => {
            const y = (((mote.y - seconds * mote.speed) % 1) + 1) % 1 * height;
            const x = mote.x * width + Math.sin(seconds * 0.25 + mote.phase) * mote.sway;
            const twinkle = 0.6 + 0.4 * Math.sin(seconds * 0.8 + mote.phase);
            ctx.globalAlpha = Math.min(1, mote.alpha * twinkle * (dark ? 1 : 0.8));
            ctx.fillStyle = `hsl(${mote.hue}, ${dark ? 85 : 72}%, ${dark ? 74 : 56}%)`;
            ctx.beginPath();
            ctx.arc(x, y, mote.r, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
        const hue = (time * 0.014) % 360;
        paintOrb(pointer.x, pointer.y, base * 0.34, hue, dark, 1.3);
        paintOrb(pointer.x, pointer.y, base * 0.13, hue + 46, dark, 1.55);
    }

    let lastFrame = 0;
    function loop(time) {
        rafId = requestAnimationFrame(loop);
        if (document.hidden) return;
        if (time - lastFrame < 22) return; // 约 45fps，省电且足够顺滑
        lastFrame = time;
        draw(time);
    }

    window.addEventListener("resize", debounce(resize, 150));
    window.addEventListener("pointermove", (event) => {
        pointer.tx = event.clientX;
        pointer.ty = event.clientY;
        pointer.moved = true;
    }, { passive: true });
    window.addEventListener("pointerdown", (event) => {
        pointer.tx = event.clientX;
        pointer.ty = event.clientY;
        pointer.moved = true;
    }, { passive: true });

    resize();
    if (reduceMotion) {
        draw(9000);
    } else {
        rafId = requestAnimationFrame(loop);
    }

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && !reduceMotion) {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(loop);
        }
    });
}

/* ==================== 5. 数据加载 ==================== */
async function fetchText(url, timeout = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { signal: controller.signal, cache: "no-cache" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    } finally {
        clearTimeout(timer);
    }
}

/* 出错时给出针对当前环境的提示 */
function deployHint() {
    if (location.protocol === "file:") {
        return "你是直接双击打开的 index.html，浏览器会拦截本地文件请求，请用本地服务器预览。";
    }
    if (location.hostname.endsWith("github.io")) {
        return "请确认仓库根目录有 .nojekyll 文件。没有它，GitHub Pages 会用 Jekyll 处理 posts 下的 .md，原始 Markdown 将无法通过网址访问。";
    }
    return "请检查网络，或确认 posts 目录与 list.json 的内容是否一致。";
}

function normalizeIndex(data) {
    if (!Array.isArray(data)) return [];
    return data
        .map((item) => (typeof item === "string" ? item : item && (item.file || item.name || item.path)))
        .filter((name) => typeof name === "string" && name.trim())
        .map((name) => name.trim());
}

/* 同源优先，其次 jsDelivr，最后 raw；任何一层返回 HTML（Jekyll 处理过）都视为失败 */
function looksLikeHtml(text) {
    return /^\s*<(?:!doctype|html|head|body)/i.test(text);
}

async function fetchMarkdown(url) {
    const text = await fetchText(url);
    if (looksLikeHtml(text)) throw new Error("返回的是一张 HTML 页面，不是 Markdown");
    return text;
}

async function resolveIndex() {
    const sources = [
        { url: `${LOCAL_BASE}/list.json`, base: LOCAL_BASE },
        { url: `${CDN_BASE}/list.json`, base: CDN_BASE },
        { url: `${REMOTE_BASE}/list.json`, base: REMOTE_BASE }
    ];

    let lastError = null;
    for (const source of sources) {
        try {
            const text = await fetchText(source.url);
            return { names: normalizeIndex(JSON.parse(text)), base: source.base };
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error("无法读取文章索引");
}

async function fetchPostRaw(fileName, base = LOCAL_BASE) {
    const encoded = encodeURIComponent(fileName);
    const sources = [
        `${base}/${encoded}`,
        `${CDN_BASE}/${encoded}`,
        `${REMOTE_BASE}/${encoded}`
    ];

    let lastError = null;
    for (const url of sources) {
        try {
            return await fetchMarkdown(url);
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error("无法读取文章");
}

async function loadPost(fileName, base = LOCAL_BASE) {
    const fallbackTitle = fileName.replace(/\.(md|markdown)$/i, "");
    let rawText;

    try {
        rawText = await fetchPostRaw(fileName, base);
    } catch (error) {
        console.warn(`跳过无法读取的文章：${fileName}`, error);
        return null;
    }

    const { meta, body } = parseFrontMatter(rawText, fallbackTitle);
    const plain = toPlainText(body);
    const description = meta.description || teaser(plain, 76);

    return {
        file: fileName,
        title: meta.title || fallbackTitle,
        description,
        tags: meta.tags,
        date: parseDate(meta.date),
        body,
        plain,
        reading: readingTime(body)
    };
}

/* ==================== 6. 首页渲染 ==================== */
/* 构建产物：一次请求拿到全部文章元数据与正文，避免 N+1 请求 */
async function loadBuiltIndex() {
    const text = await fetchText(`${LOCAL_BASE}/index.json`);
    const data = JSON.parse(text);
    if (!Array.isArray(data) || !data.length) throw new Error("index.json 为空");
    return data.map((item) => ({
        file: item.file,
        slug: item.slug,
        title: item.title,
        description: item.description || "",
        tags: Array.isArray(item.tags) ? item.tags : [],
        date: parseDate(item.date),
        body: "",
        plain: item.plain || "",
        reading: item.reading || 1,
        url: item.url || ""
    }));
}

async function loadPosts() {
    renderSkeletons();
    state.loading = true;
    updateMeta(0, "");

    try {
        const built = await loadBuiltIndex();
        state.base = LOCAL_BASE;
        state.posts = built.sort((a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0));
        state.loading = false;
        renderPosts(state.posts);
        return;
    } catch (builtError) {
        /* 还没跑构建时（本地开发），回落到 list.json + 逐篇读取 */
    }

    try {
        const { names, base } = await resolveIndex();
        state.base = base;

        if (!names.length) {
            state.loading = false;
            state.posts = [];
            renderState({
                emoji: "inbox",
                title: "这里还没有文章",
                sub: "在 posts 目录新增 Markdown 文件，并把文件名写进 list.json 就会出现在这里。"
            });
            updateMeta(0, "");
            return;
        }

        const posts = await Promise.all(names.map((name) => loadPost(name, base)));
        state.posts = posts
            .filter(Boolean)
            .sort((a, b) => (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0));

        state.loading = false;

        if (!state.posts.length) {
            renderState({
                emoji: "alert",
                title: "文章读取失败",
                sub: `索引文件存在，但没有任何一篇文章成功加载。${deployHint()}`,
                action: { label: "重新加载", onClick: loadPosts }
            });
            updateMeta(0, "");
            return;
        }

        renderPosts(state.posts);
    } catch (error) {
        console.error(error);
        state.loading = false;
        renderState({
            emoji: "alert",
            title: "数据加载失败",
            sub: `${error.message || "未知错误"}。${deployHint()}`,
            action: { label: "重新加载", onClick: loadPosts }
        });
        updateMeta(0, "");
    }
}

function renderSkeletons(count = 3) {
    const grid = $("#posts-list");
    grid.innerHTML = Array.from({ length: count }, () => `
        <div class="skeleton-card" aria-hidden="true">
            <div class="sk-line title"></div>
            <div class="sk-line body"></div>
            <div class="sk-line body short"></div>
            <div class="sk-line foot"></div>
        </div>
    `).join("");
    $("#search-meta").textContent = "正在读取文章列表…";
    const filter = $("#tag-filter");
    if (filter) {
        filter.hidden = true;
        filter.innerHTML = "";
    }
}

function renderPosts(posts) {
    const grid = $("#posts-list");
    state.activeIndex = -1;
    grid.innerHTML = "";
    renderTagFilter();

    if (!posts.length) {
        if (state.query) {
            renderState({
                emoji: "search",
                title: "没有找到匹配的文章",
                sub: "换个关键词试试，或者按 Esc 清空当前的搜索条件。",
                action: { label: "清除搜索", onClick: clearSearch }
            });
        } else {
            renderState({ emoji: "inbox", title: "还没有文章", sub: "等第一篇文章落笔。" });
        }
        updateMeta(0, state.query);
        return;
    }

    const fragment = document.createDocumentFragment();
    posts.forEach((post, index) => {
        fragment.appendChild(createCard(post, index));
    });
    grid.appendChild(fragment);
    updateMeta(posts.length, state.query);
}

function createCard(post, index) {
    const card = document.createElement("a");
    card.className = "post-card";
    card.href = post.url || `post.html?p=${encodeURIComponent(post.file)}`;
    card.style.setProperty("--i", Math.min(index, 12));

    const tokens = state.matchTokens;
    const hasQuery = tokens.length > 0;
    const titleHit = hasQuery && tokens.some((t) => post.title.toLowerCase().includes(t));
    const bodyHit = hasQuery && tokens.some((t) => post.plain.toLowerCase().includes(t));
    const showSnippet = hasQuery && bodyHit && !titleHit;

    const descHtml = showSnippet
        ? highlight(makeSnippet(post, tokens), tokens)
        : highlight(post.description || "点击阅读全文", tokens);

    const tags = post.tags
        .map((tag) => `<span class="tag">${highlight(tag, tokens)}</span>`)
        .join("");

    card.innerHTML = `
        <h2 class="post-title">${highlight(post.title, tokens)}</h2>
        <p class="post-desc${showSnippet ? " is-snippet" : ""}">${descHtml}</p>
        ${tags ? `<div class="post-tags">${tags}</div>` : ""}
        <div class="post-foot">
            <span class="meta-left">${ICON.calendar}${formatDate(post.date)}</span>
            <span>${ICON.clock} ${post.reading} 分钟</span>
        </div>
    `;

    // Fluent Reveal：让高光跟随指针
    card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        card.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });

    return card;
}

function renderState({ emoji = "inbox", title, sub = "", action }) {
    const grid = $("#posts-list");
    const icons = {
        inbox: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13.5V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6.5"></path><path d="M4 13.5h4l1.4 2.2h5.2l1.4-2.2h4V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path></svg>',
        search: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="10.8" cy="10.8" r="6.3"></circle><path d="M15.4 15.4L20 20"></path></svg>',
        alert: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"></circle><path d="M12 7.6v5M12 15.9v.6"></path></svg>'
    };

    grid.innerHTML = `
        <div class="state-block">
            <span class="state-emoji">${icons[emoji] || icons.inbox}</span>
            <p class="state-title">${escapeHtml(title)}</p>
            ${sub ? `<p class="state-sub">${escapeHtml(sub)}</p>` : ""}
            ${action ? `<button class="state-action" type="button">${escapeHtml(action.label)}</button>` : ""}
        </div>
    `;

    if (action) {
        $(".state-action", grid).addEventListener("click", action.onClick);
    }
}

/* 标签筛选条：标签来自每篇文章的 front matter，随文章增加自动增长 */
const TAG_LIMIT = 12;

function renderTagFilter() {
    const wrap = $("#tag-filter");
    if (!wrap) return;

    const counts = new Map();
    state.posts.forEach((post) => {
        post.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });

    if (!counts.size) {
        wrap.hidden = true;
        wrap.innerHTML = "";
        return;
    }

    const activeTag = /^#[^\s]+$/.test(state.query) ? state.query.slice(1) : "";
    const allTags = [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hans-CN"));

    const visible = state.tagExpanded ? allTags : allTags.slice(0, TAG_LIMIT);

    if (activeTag && counts.has(activeTag) && !visible.some(([tag]) => tag === activeTag)) {
        visible.unshift([activeTag, counts.get(activeTag)]);
    }

    const hiddenCount = allTags.length - TAG_LIMIT;
    const moreChip = hiddenCount > 0
        ? `<button class="filter-chip filter-more" type="button" data-more="1">${state.tagExpanded ? "收起" : `更多 +${hiddenCount}`}</button>`
        : "";

    wrap.hidden = false;
    wrap.innerHTML = [
        `<button class="filter-chip${state.query ? "" : " is-active"}" type="button" data-tag="" aria-pressed="${state.query ? "false" : "true"}">全部<em>${state.posts.length}</em></button>`,
        ...visible.map(([tag, count]) => `
            <button class="filter-chip${activeTag === tag ? " is-active" : ""}" type="button" data-tag="${escapeHtml(tag)}" aria-pressed="${activeTag === tag ? "true" : "false"}">
                ${escapeHtml(tag)}<em>${count}</em>
            </button>`),
        moreChip
    ].join("");
}

function updateMeta(count, query) {
    const meta = $("#search-meta");
    if (query) {
        const label = /^#[^\s]+$/.test(query) ? query.slice(1) : query;
        meta.innerHTML = count
            ? `找到 <strong>${count}</strong> 篇与 “${escapeHtml(label)}” 相关的文章`
            : `没有与 “${escapeHtml(label)}” 相关的文章`;
        return;
    }
    if (state.loading) {
        meta.textContent = "正在读取文章列表…";
        return;
    }
    const latest = state.posts.find((post) => post.date);
    meta.innerHTML = state.posts.length
        ? `共 <strong>${state.posts.length}</strong> 篇文章
           <span class="dot">·</span> 最近更新 ${latest ? formatDate(latest.date) : "—"}
           <span class="dot">·</span> 支持空格多关键词与 #标签`
        : "";
}

/* ==================== 7. 搜索 ==================== */
function initSearch() {
    const input = $("#search-input");
    const clearBtn = $("#search-clear");
    if (!input) return;

    // macOS 上显示 ⌘K
    if (/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)) {
        const kbd = $("#search-kbd");
        if (kbd) kbd.innerHTML = "<span>⌘</span>K";
    }

    let composing = false;
    const runSearch = debounce(() => applySearch(input.value), 90);

    input.addEventListener("compositionstart", () => { composing = true; });
    input.addEventListener("compositionend", () => {
        composing = false;
        applySearch(input.value);
    });
    input.addEventListener("input", () => {
        if (!composing) runSearch();
    });

    input.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveActive(1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActive(-1);
        } else if (event.key === "Enter") {
            const cards = $$(".post-card");
            if (!cards.length) return;
            event.preventDefault();
            cards[state.activeIndex >= 0 ? state.activeIndex : 0].click();
        } else if (event.key === "Escape") {
            if (input.value) {
                event.preventDefault();
                clearSearch();
            } else {
                input.blur();
            }
        }
    });

    clearBtn.addEventListener("click", () => {
        clearSearch();
        input.focus();
    });

    $("#tag-filter").addEventListener("click", (event) => {
        const more = event.target.closest("[data-more]");
        if (more) {
            state.tagExpanded = !state.tagExpanded;
            renderTagFilter();
            return;
        }

        const chip = event.target.closest(".filter-chip");
        if (!chip) return;
        const tag = chip.dataset.tag;
        input.value = tag ? `#${tag}` : "";
        applySearch(input.value);
        if (window.matchMedia("(pointer: fine)").matches) input.focus();
    });

    document.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        if ((event.ctrlKey || event.metaKey) && key === "k") {
            event.preventDefault();
            input.focus();
            input.select();
        }
        if (event.key === "/" && document.activeElement !== input && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
            event.preventDefault();
            input.focus();
        }
    });
}

function tokenize(value) {
    return value
        .toLowerCase()
        .split(/[\s,，、]+/)
        .map((token) => token.trim())
        .filter(Boolean);
}

function applySearch(value) {
    const query = value.trim();
    state.query = query;
    state.tokens = tokenize(query);
    state.matchTokens = state.tokens.map((token) => token.replace(/^#/, "")).filter(Boolean);
    $("#search-clear").hidden = !query;

    if (!state.tokens.length) {
        renderPosts(state.posts);
        return;
    }
    renderPosts(searchPosts(state.tokens));
}

function clearSearch() {
    const input = $("#search-input");
    input.value = "";
    applySearch("");
    input.focus();
}

function searchPosts(tokens) {
    const results = [];

    state.posts.forEach((post) => {
        const title = post.title.toLowerCase();
        const description = post.description.toLowerCase();
        const tags = post.tags.map((tag) => tag.toLowerCase());
        const body = post.plain.toLowerCase();

        let score = 0;
        let matchedAll = true;

        for (const rawToken of tokens) {
            const tagOnly = rawToken.startsWith("#");
            const token = tagOnly ? rawToken.slice(1) : rawToken;
            if (!token) continue;

            let hit = 0;

            if (!tagOnly) {
                if (title === token) hit += 60;
                else if (title.startsWith(token)) hit += 36;
                else if (title.includes(token)) hit += 24;

                if (description.includes(token)) hit += 9;
            }

            if (tags.some((tag) => tag === token)) hit += 20;
            else if (tags.some((tag) => tag.includes(token))) hit += 12;

            if (!hit && body.includes(token)) hit += 6;

            if (!hit) {
                matchedAll = false;
                break;
            }
            score += hit;
        }

        if (matchedAll && score > 0) {
            results.push({ post, score });
        }
    });

    results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.post.date ? b.post.date.getTime() : 0) - (a.post.date ? a.post.date.getTime() : 0);
    });

    return results.map((item) => item.post);
}

function moveActive(step) {
    const cards = $$(".post-card");
    if (!cards.length) return;

    const next = Math.min(cards.length - 1, Math.max(0, state.activeIndex + step));
    if (state.activeIndex === next && step > 0) return;

    state.activeIndex = next;
    cards.forEach((card, index) => card.classList.toggle("is-active", index === next));
    cards[next].scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function makeSnippet(post, tokens) {
    const text = post.plain;
    if (!text) return post.description;

    const lower = text.toLowerCase();
    let index = -1;
    let length = 0;

    tokens.forEach((token) => {
        const found = lower.indexOf(token);
        if (found >= 0 && (index < 0 || found < index)) {
            index = found;
            length = token.length;
        }
    });

    if (index < 0) return post.description;

    const PUNCT = "。！？；，、!?;,.";
    let start = Math.max(0, index - 36);
    let end = Math.min(text.length, index + length + 84);

    // 向前对齐到最近的标点，避免摘要从半个句子开始
    if (start > 0) {
        for (let i = index - 1; i >= start; i -= 1) {
            if (PUNCT.includes(text[i])) {
                start = i + 1;
                break;
            }
        }
    }

    // 向后对齐到最近的标点，避免摘要停在半个词上
    if (end < text.length) {
        for (let i = index + length; i < end; i += 1) {
            if (PUNCT.includes(text[i])) {
                end = i + 1;
                break;
            }
        }
    }

    const head = text.slice(start, end).trim();
    return `${start > 0 ? "…" : ""}${head}${end < text.length ? "…" : ""}`;
}

function highlight(text, tokens) {
    const safe = escapeHtml(text);
    const list = [...new Set((tokens || []).filter(Boolean))]
        .sort((a, b) => b.length - a.length);

    if (!list.length) return safe;

    const pattern = new RegExp(list.map(escapeRegExp).join("|"), "gi");
    return safe.replace(pattern, (match) => `<mark>${match}</mark>`);
}

/* 支持 index.html?tag=前端 直达某个标签 */
function applyTagFromQuery() {
    const tag = new URLSearchParams(location.search).get("tag");
    if (!tag) return;
    const input = $("#search-input");
    if (!input) return;
    input.value = `#${tag}`;
    applySearch(input.value);
}

/* ==================== 8. 文章页 ==================== */
/* 静态文章页：内容已在 HTML 里，只做增强 */
function initStaticPost() {
    const article = $("#article-detail");
    if (!article) return;
    enhanceArticle(article);
    initComments();
    state.articleReady = true;
    updateScrollUi();
}

/* 评论（Utterances）跟随明暗主题 */
const UTTERANCES_ORIGIN = "https://utteranc.es";

function syncCommentsTheme() {
    const frame = $("iframe.utterances-frame");
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({
        type: "set-theme",
        theme: document.documentElement.dataset.theme === "dark" ? "github-dark" : "github-light"
    }, UTTERANCES_ORIGIN);
}

function initComments() {
    const host = $(".utterances");
    if (!host) return;

    const current = document.documentElement.dataset.theme === "dark" ? "github-dark" : "github-light";
    const config = $('script[src*="utteranc.es/client.js"]');
    if (config) config.setAttribute("theme", current);

    // iframe 内部的监听要等脚本执行完才就绪，前几次消息可能丢失，所以持续补发
    let attempts = 0;
    const timer = window.setInterval(() => {
        attempts += 1;
        if ($("iframe.utterances-frame")) syncCommentsTheme();
        if (attempts >= 15) window.clearInterval(timer);
    }, 500);
}

function enhanceArticle(container) {
    highlightCode(container);
    addCopyButtons(container);
    initTocSpy();
}

function highlightCode(container) {
    if (!window.hljs) return;
    container.querySelectorAll("pre code").forEach((block) => {
        if (block.dataset.highlighted === "yes") return;
        try {
            window.hljs.highlightElement(block);
        } catch (error) {
            /* 高亮失败不影响阅读 */
        }
    });
}

function addCopyButtons(container) {
    container.querySelectorAll("pre").forEach((pre) => {
        if (pre.parentElement && pre.parentElement.classList.contains("code-block")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "code-block";
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const code = pre.querySelector("code");
        const language = code
            ? [...code.classList].find((name) => name.startsWith("language-"))
            : "";
        const label = language ? language.replace("language-", "") : "";

        const bar = document.createElement("div");
        bar.className = "code-bar";
        bar.innerHTML = `<span class="code-lang">${escapeHtml(label)}</span>`;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "code-copy";
        button.textContent = "复制";
        bar.appendChild(button);

        button.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(code ? code.innerText : pre.innerText);
                button.textContent = "已复制";
            } catch (error) {
                button.textContent = "复制失败";
            }
            setTimeout(() => { button.textContent = "复制"; }, 1600);
        });

        wrapper.appendChild(bar);
    });
}

function initTocSpy() {
    const links = $$(".toc a[href^='#']");
    if (!links.length) return;

    const entries = links
        .map((link) => {
            const id = decodeURIComponent(link.getAttribute("href").slice(1));
            return { link, heading: document.getElementById(id) };
        })
        .filter((entry) => entry.heading);
    if (!entries.length) return;

    const update = () => {
        const offset = 120;
        let current = entries[0];

        for (const entry of entries) {
            if (entry.heading.getBoundingClientRect().top <= offset) {
                current = entry;
            } else {
                break;
            }
        }

        // 滚到底部时点亮最后一条
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
            current = entries[entries.length - 1];
        }

        entries.forEach((entry) => {
            entry.link.classList.toggle("is-active", entry === current);
        });
    };

    let ticking = false;
    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            update();
            ticking = false;
        });
    }, { passive: true });

    window.addEventListener("resize", debounce(update, 120));
    update();
}

async function initPostPage() {
    const article = $("#article-detail");
    const fileName = new URLSearchParams(location.search).get("p");

    if (!fileName) {
        renderArticleError(article, "没有指定文章", "链接里缺少文章参数，请从首页的卡片进入。");
        return;
    }

    article.innerHTML = `
        <div class="article-loading" aria-hidden="true">
            <div class="sk-line title"></div>
            <div class="sk-line body"></div>
            <div class="sk-line body short"></div>
            <div class="sk-line body wide"></div>
            <div class="sk-line body"></div>
        </div>
    `;

    try {
        const post = await loadPost(fileName);
        if (!post) throw new Error("文章不存在");

        document.title = `${post.title} · 云海阁`;
        article.innerHTML = buildArticleHtml(post);
        enhanceArticle(article);
        state.articleReady = true;
        updateScrollUi();

        article.setAttribute("tabindex", "-1");
        article.focus({ preventScroll: true });
    } catch (error) {
        console.error(error);
        renderArticleError(article, "文章没有找到", `没能读取「${fileName}」。它可能已经被移动或改名，返回首页看看其它文章吧。`);
    }
}

function renderArticleError(article, title, sub) {
    document.title = "文章未找到 · 云海阁";
    article.innerHTML = `
        <div class="article-state">
            <span class="state-emoji">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
                    <circle cx="12" cy="12" r="8.6"></circle><path d="M12 7.6v5M12 15.9v.6"></path>
                </svg>
            </span>
            <p class="state-title">${escapeHtml(title)}</p>
            <p class="state-sub">${escapeHtml(sub)}</p>
            <a class="state-action" href="index.html">返回首页</a>
        </div>
    `;
}

function buildArticleHtml(post) {
    const meta = [
        `<span class="meta-item">${ICON.calendar}${formatDate(post.date)}</span>`,
        `<span class="meta-sep"></span>`,
        `<span class="meta-item">${ICON.clock}${post.reading} 分钟阅读</span>`
    ];

    const tags = post.tags.length
        ? `<div class="article-tags">
               ${post.tags.map((tag) => `<a class="tag" href="index.html?tag=${encodeURIComponent(tag)}" title="查看所有「${escapeHtml(tag)}」标签的文章">${escapeHtml(tag)}</a>`).join("")}
           </div>`
        : "";

    return `
        <header class="article-header">
            <h1>${escapeHtml(post.title)}</h1>
            <div class="article-meta">${meta.join("")}</div>
            ${tags}
        </header>
        ${renderMarkdown(stripLeadingHeading(post.body)) || '<p style="color:var(--text-3)">这篇文章还没有正文。</p>'}
    `;
}

// 顶部已渲染标题，正文若再次以 H1 开头则去掉，避免重复
function stripLeadingHeading(markdown) {
    return markdown.replace(/^\s*#\s+[^\n]*(?:\r?\n)+/, "");
}

function renderMarkdown(markdown) {
    if (window.marked && typeof window.marked.parse === "function") {
        try {
            const html = window.marked.parse(markdown, { gfm: true, breaks: true });
            return sanitizeHtml(html);
        } catch (error) {
            console.warn("Markdown 解析失败，使用内置渲染器", error);
        }
    }
    return sanitizeHtml(fallbackMarkdown(markdown));
}

function sanitizeHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    template.content.querySelectorAll("script, style, iframe, object, embed, form, input, link").forEach((node) => node.remove());

    template.content.querySelectorAll("*").forEach((element) => {
        [...element.attributes].forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            const value = attribute.value.trim();
            if (name.startsWith("on") || /^javascript:/i.test(value)) {
                element.removeAttribute(attribute.name);
            }
        });
    });
    return template.innerHTML;
}

function fallbackMarkdown(source) {
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let inCode = false;
    let listType = null;
    let paragraph = [];

    const flushParagraph = () => {
        if (paragraph.length) {
            html += `<p>${inline(paragraph.join(" "))}</p>`;
            paragraph = [];
        }
    };
    const closeList = () => {
        if (listType) {
            html += `</${listType}>`;
            listType = null;
        }
    };

    lines.forEach((line) => {
        if (/^```/.test(line)) {
            flushParagraph();
            closeList();
            html += inCode ? "</code></pre>" : "<pre><code>";
            inCode = !inCode;
            return;
        }
        if (inCode) {
            html += `${escapeHtml(line)}\n`;
            return;
        }
        if (!line.trim()) {
            flushParagraph();
            closeList();
            return;
        }
        const heading = /^(#{1,6})\s+(.*)$/.exec(line);
        if (heading) {
            flushParagraph();
            closeList();
            const level = heading[1].length;
            html += `<h${level}>${inline(heading[2])}</h${level}>`;
            return;
        }
        const unordered = /^\s*[-*+]\s+(.*)$/.exec(line);
        if (unordered) {
            flushParagraph();
            if (listType !== "ul") {
                closeList();
                html += "<ul>";
                listType = "ul";
            }
            html += `<li>${inline(unordered[1])}</li>`;
            return;
        }
        const ordered = /^\s*\d+\.\s+(.*)$/.exec(line);
        if (ordered) {
            flushParagraph();
            if (listType !== "ol") {
                closeList();
                html += "<ol>";
                listType = "ol";
            }
            html += `<li>${inline(ordered[1])}</li>`;
            return;
        }
        const quote = /^>\s?(.*)$/.exec(line);
        if (quote) {
            flushParagraph();
            closeList();
            html += `<blockquote>${inline(quote[1])}</blockquote>`;
            return;
        }
        paragraph.push(line);
    });

    flushParagraph();
    closeList();
    if (inCode) html += "</code></pre>";
    return html;
}

function inline(text) {
    return escapeHtml(text)
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" loading="lazy">')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/~~([^~]+)~~/g, "<del>$1</del>");
}

/* ==================== 9. 公共交互 ==================== */
function splitChars(element) {
    if (!element) return;
    const text = element.textContent.trim();
    element.textContent = "";
    [...text].forEach((char, index) => {
        const span = document.createElement("span");
        span.className = "ch";
        span.style.setProperty("--i", index);
        span.textContent = char;
        element.appendChild(span);
    });
}

/* 把印章从页面中央送到导航栏，用 FLIP 换算位移与缩放 */
function flySealToBrand(intro) {
    const seal = $(".intro-mark", intro);
    const brand = $(".brand-mark");
    if (!seal || !brand) return;

    const from = seal.getBoundingClientRect();
    const to = brand.getBoundingClientRect();
    if (!from.width || !to.width) return;

    const clone = seal.cloneNode(true);
    clone.classList.add("intro-mark-fly");
    clone.style.animation = "none";
    clone.style.left = `${from.left}px`;
    clone.style.top = `${from.top}px`;
    clone.style.width = `${from.width}px`;
    clone.style.height = `${from.height}px`;
    document.body.appendChild(clone);

    seal.style.opacity = "0";
    brand.style.opacity = "0";

    const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    const scale = to.width / from.width;

    const animation = clone.animate(
        [
            { transform: "translate(0px, 0px) scale(1) rotate(-3deg)" },
            { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(0deg)` }
        ],
        { duration: 780, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "forwards" }
    );

    animation.onfinish = () => {
        clone.remove();
        brand.style.opacity = "";
    };
}

function seedParticles(layer) {
    if (!layer) return;
    for (let i = 0; i < 18; i += 1) {
        const dot = document.createElement("span");
        const size = (2 + Math.random() * 4).toFixed(1);
        dot.style.left = `${(Math.random() * 100).toFixed(2)}%`;
        dot.style.top = `${(14 + Math.random() * 72).toFixed(2)}%`;
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.setProperty("--d", `${(Math.random() * 2.6).toFixed(2)}s`);
        dot.style.setProperty("--t", `${(3.2 + Math.random() * 2.8).toFixed(2)}s`);
        dot.style.setProperty("--h", String(185 + Math.floor(Math.random() * 90)));
        layer.appendChild(dot);
    }
}

function initIntro() {
    const intro = $("#intro");
    if (!intro) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
        seen = sessionStorage.getItem(INTRO_KEY) === "1";
    } catch (error) {
        seen = false;
    }

    if (reduceMotion || seen) {
        intro.remove();
        return;
    }

    const root = document.documentElement;
    root.classList.add("is-intro");
    splitChars($(".intro-name", intro));
    splitChars($(".intro-motto", intro));
    seedParticles($(".intro-particles", intro));

    let leaving = false;
    let finished = false;

    const finish = () => {
        if (finished) return;
        finished = true;
        root.classList.remove("is-intro");
        intro.remove();
        const brand = $(".brand-mark");
        if (brand) brand.style.opacity = "";
        try {
            sessionStorage.setItem(INTRO_KEY, "1");
        } catch (error) {
            /* 隐私模式下忽略 */
        }
    };

    const leave = (fast) => {
        if (leaving || finished) return;
        leaving = true;
        if (!fast) flySealToBrand(intro);
        intro.classList.add("is-leaving");
        if (fast) intro.classList.add("is-fast");
        // 遮罩淡出后立即解锁滚动；等内容的浮起动画播完再移除节点，避免最后一帧跳动
        window.setTimeout(() => root.classList.remove("is-intro"), fast ? 400 : 900);
        window.setTimeout(finish, fast ? 520 : 1450);
    };

    const timer = window.setTimeout(() => leave(false), 1700);

    const skip = () => {
        window.clearTimeout(timer);
        leave(true);
    };

    ["pointerdown", "wheel", "keydown", "touchstart"].forEach((type) => {
        window.addEventListener(type, skip, { once: true, passive: true });
    });

    // 兜底：万一动画事件没触发，也能收场
    window.setTimeout(() => {
        if (finished) return;
        finished = true;
        root.classList.remove("is-intro");
        intro.remove();
        const brand = $(".brand-mark");
        if (brand) brand.style.opacity = "";
    }, 4200);
}

function initScrollEffects() {
    const copy = $("#copy-link");
    if (copy) copy.addEventListener("click", copyLink);

    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();

    updateScrollUi();
    window.addEventListener("scroll", () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => {
            updateScrollUi();
            scrollTicking = false;
        });
    }, { passive: true });
}

let scrollTicking = false;

function updateScrollUi() {
    const navbar = $("#navbar");
    if (navbar) navbar.classList.toggle("is-scrolled", window.scrollY > 6);

    const progress = $("#reading-progress");
    if (!progress) return;

    const bar = progress.firstElementChild;
    const active = PAGE === "post" && state.articleReady;
    progress.classList.toggle("is-active", active);

    if (!active) {
        bar.style.width = "0%";
        return;
    }

    const total = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
    bar.style.width = `${ratio * 100}%`;
}

async function copyLink() {
    const button = $("#copy-link");
    try {
        await navigator.clipboard.writeText(location.href);
    } catch (error) {
        const helper = document.createElement("textarea");
        helper.value = location.href;
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
    }

    button.textContent = "已复制链接";
    button.classList.add("is-copied");
    setTimeout(() => {
        button.textContent = "复制链接";
        button.classList.remove("is-copied");
    }, 1800);
}

/* ==================== 10. 启动 ==================== */
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initAurora();
    initScrollEffects();

    if (PAGE === "post") {
        initPostPage();
        return;
    }

    if (PAGE === "post-static") {
        initStaticPost();
        return;
    }

    if (PAGE === "page") {
        return;
    }

    initIntro();
    initSearch();
    loadPosts().then(applyTagFromQuery);
});
