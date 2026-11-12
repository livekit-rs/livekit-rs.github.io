import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { join, relative, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked, Renderer } from 'marked';

const site = dirname(fileURLToPath(import.meta.url));
const output = join(site, 'dist');
const origin = 'https://livekit-rs.com/';
const repository = 'https://github.com/livekit-rs/livekit-rs';
const license = `${repository}/blob/main/LICENSE`;
const issues = `${repository}/issues`;
const locales = {
  en: {
    route: '', name: 'English', home: 'Home', guides: 'Quickstart', cli: 'CLI', sdk: 'SDKs', compatibility: 'Compatibility',
    homeTitle: 'livekit-rs — Rust WebRTC Server, LiveKit Compatible',
    skip: 'Skip to content', nav: 'Main navigation', contents: 'On this page',
    guideDescription: 'Start a local livekit-rs server, connect a client SDK, and find guides for deployment and troubleshooting.',
    guideNav: 'Guides', source: 'View source on GitHub', issues: 'Report an issue',
    headline: 'Real-time media.\nBuilt in Rust.',
    description: 'An open-source, single-node WebRTC server for audio, video, and data, targeting full compatibility with LiveKit Server v1.13.10.',
    start: 'Get started', compare: 'Compare with Go', pipeline: 'Media forwarding path',
    publish: 'Publishers', node: 'Rust SFU', subscribe: 'Subscribers',
    media: 'Audio · Video · Data',
    features: 'Run your own media node',
    cards: [
      ['WebRTC media', 'Forward real-time audio, video, and reliable data with tested simulcast and selected scalable-video profiles.'],
      ['LiveKit interfaces', 'Use LiveKit client signaling, JWTs, Twirp Server APIs, and webhooks in the tested configurations.'],
      ['Single-node operations', 'Deploy one Rust binary with UDP, ICE/TCP, TURN/UDP, and HTTPS/WSS.'],
    ],
    evidenceTitle: 'Compatibility you can verify',
    evidenceText: 'The comparison records both passing cases and open gaps against the pinned Go release. Full parity and more stable video on identical hardware remain goals.',
    baseline: 'Go reference', footer: 'Single-node WebRTC server in Rust',
  },
  'zh-Hans': {
    route: 'zh-hans/', name: '简体中文', home: '首页', guides: '快速开始', cli: 'CLI', sdk: 'SDK 接入', compatibility: '兼容性',
    homeTitle: 'livekit-rs — Rust 开源 WebRTC 服务器，兼容 LiveKit',
    skip: '跳到正文', nav: '主导航', contents: '本页目录',
    guideDescription: '从本地启动 livekit-rs 和接入客户端 SDK 开始，查看单机部署与故障排查指南。',
    guideNav: '使用指南', source: '在 GitHub 查看源码', issues: '反馈问题',
    headline: '实时媒体，\n用 Rust 构建。',
    description: '转发实时音频、视频与数据的开源单节点 WebRTC 服务器，目标是与 LiveKit Server v1.13.10 完全兼容。',
    start: '快速开始', compare: '查看 Go 对照', pipeline: '媒体转发路径',
    publish: '发布端', node: 'Rust SFU', subscribe: '订阅端',
    media: '音频 · 视频 · 数据',
    features: '部署自己的媒体节点',
    cards: [
      ['WebRTC 媒体', '转发实时音频、视频和可靠数据。已测试 Simulcast 和指定的可伸缩视频配置。'],
      ['LiveKit 接口', '在已验证的配置中使用 LiveKit 客户端信令、JWT、Twirp Server API 和 Webhook。'],
      ['单节点运维', '用一个 Rust 二进制部署，支持 UDP、ICE/TCP、TURN/UDP 和 HTTPS/WSS。'],
    ],
    evidenceTitle: '可核查的兼容性',
    evidenceText: '对照记录与固定 Go 版本之间已通过的用例和仍待验收的差异。完整兼容与同硬件下的视频稳定性提升仍是目标。',
    baseline: 'Go 对照基线', footer: '用 Rust 实现的单节点 WebRTC 服务器',
  },
};

const navigation = ['', 'guides', 'cli', 'sdk', 'compatibility'];
const tutorials = {
  'sdk/react': 'React',
  'sdk/android': 'Android',
  'sdk/ios': 'iOS',
  'sdk/flutter': 'Flutter',
};
const guideChapters = {
  'guides/concepts': {
    en: ['What you will use', 'Learn how rooms, participants, and media tracks fit together in livekit-rs.'],
    'zh-Hans': ['会用到什么', '了解 livekit-rs 的房间、参与者、媒体轨道和接入工具。'],
  },
  'guides/build-locally': {
    en: ['Build and run locally', 'Build livekit-rs from source, start a local development server, and check that it is ready.'],
    'zh-Hans': ['本地构建与启动', '从源码构建 livekit-rs，启动本地开发服务并检查服务是否就绪。'],
  },
  'guides/connect-sdk': {
    en: ['Connect with a LiveKit SDK', 'Create a room and make a first livekit-rs call between two clients.'],
    'zh-Hans': ['用 LiveKit SDK 接入', '创建房间，用两个客户端接入 livekit-rs 并完成第一次通话。'],
  },
  'guides/deploy': {
    en: ['Deploy a single node', 'Deploy a livekit-rs node with a standalone configuration, TLS, and reachable WebRTC ports.'],
    'zh-Hans': ['单机部署', '配置 livekit-rs 单节点、TLS 和 WebRTC 端口。'],
  },
  'guides/configuration': {
    en: ['CLI and configuration', 'Inspect livekit-rs server flags and learn how YAML, flags, and environment variables are applied.'],
    'zh-Hans': ['CLI 和配置', '查看 livekit-rs 服务端参数，了解 YAML、命令行选项和环境变量的使用方式。'],
  },
  'guides/migration': {
    en: ['Check a migration', 'Verify your client SDK, media, and server API workflows before switching to livekit-rs.'],
    'zh-Hans': ['验证迁移', '切换到 livekit-rs 前，验证客户端 SDK、音视频和服务端 API 的实际行为。'],
  },
  'guides/troubleshooting': {
    en: ['Troubleshoot a call', 'Diagnose livekit-rs connection, authorization, media, and startup failures.'],
    'zh-Hans': ['排查通话问题', '排查 livekit-rs 的连接、鉴权、音视频和启动问题。'],
  },
};
const pages = [...navigation, ...Object.keys(tutorials), ...Object.keys(guideChapters)];
const pageFiles = new Map(pages.slice(1).map((page) => [page.replaceAll('/', '-'), page]));
const route = (lang, page) => locales[lang].route + (page ? page + '/' : '');
const url = (from, to) => (relative(from || '.', to || '.').split(sep).join('/') || '.') + '/';
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const headingId = (label) => label.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');

function lastmod(source) {
  try {
    return execSync(`git log -1 --format=%cs -- "${source}"`, { cwd: site, encoding: 'utf8' }).trim()
      || new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function home(lang) {
  const t = locales[lang];
  const from = route(lang, '');
  return `<section class="hero"><div class="hero-copy">
    <h1>${escape(t.headline).replaceAll('\n', '<br>')}</h1>
    <p class="lede">${t.description}</p>
    <div class="actions"><a class="button primary" href="${repository}">${t.source} <span aria-hidden="true">↗</span></a>
    <a class="button secondary" href="${url(from, route(lang, 'guides'))}">${t.start}</a>
    <a class="button secondary" href="${url(from, route(lang, 'compatibility'))}">${t.compare}</a></div></div>
    <figure class="pipeline"><figcaption>${t.pipeline}</figcaption><div class="flow">
      <span>${t.publish}</span><b aria-hidden="true">→</b><strong>${t.node}</strong><b aria-hidden="true">→</b><span>${t.subscribe}</span>
    </div><p>${t.media}</p></figure>
  </section>
  <section class="features"><h2>${t.features}</h2><div class="cards">${t.cards.map(([title, copy]) =>
    `<article><h3>${title}</h3><p>${copy}</p></article>`).join('')}</div></section>
  <section class="evidence-band"><div><h2>${t.evidenceTitle}</h2><p>${t.evidenceText}</p></div>
    <a class="baseline" href="${url(from, route(lang, 'compatibility'))}"><span>${t.baseline}</span><strong>v1.13.10 <span aria-hidden="true">↗</span></strong></a></section>`;
}

const downloads = {
  '../examples/FirstCall.jsx': 'downloads/FirstCall.jsx',
  '../examples/MainActivity.kt': 'downloads/MainActivity.kt',
  '../examples/ContentView.swift': 'downloads/ContentView.swift',
  '../examples/main.dart': 'downloads/main.dart',
  '../examples/first-call.html': 'downloads/first-call.html',
  '../examples/server-sdk.mjs': 'downloads/server-sdk.mjs',
  '../examples/standalone.yaml': 'downloads/standalone.yaml',
  '../examples/livecloud.service': 'downloads/livecloud.service',
  '../examples/native-tls.md': 'downloads/native-tls.md',
};

async function document(lang, page) {
  const source = await readFile(join(site, 'content', `${page.replaceAll('/', '-')}.${lang}.md`), 'utf8');
  const from = route(lang, page);
  const headings = [];
  const renderer = new Renderer();
  renderer.heading = function ({ depth, text, tokens }) {
    const id = headingId(text);
    if (depth === 2) headings.push([id, text]);
    return `<h${depth} id="${escape(id)}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
  };
  renderer.link = function (token) {
    const href = token.href;
    const [path, fragment] = href.split('#', 2);
    const doc = /^([a-z-]+)\.(en|zh-Hans)\.md$/.exec(path);
    let target;
    if (doc && pageFiles.has(doc[1])) target = url(from, route(doc[2], pageFiles.get(doc[1])));
    else if (downloads[path]) target = url(from, dirname(downloads[path])) + downloads[path].split('/').pop();
    else if (path.startsWith('../evidence/')) target = url(from, 'evidence') + path.split('/').pop();
    if (target) token = { ...token, href: target + (fragment ? '#' + fragment : '') };
    if (downloads[path] && /\.(html|mjs|jsx|kt|swift|dart)$/.test(path)) {
      return `<a href="${escape(token.href)}" download>${this.parser.parseInline(token.tokens)}</a>`;
    }
    return Renderer.prototype.link.call(this, token);
  };
  const parser = new Marked({ renderer });
  const body = parser.parse(source);
  const toc = headings.map(([id, label]) => `<li><a href="#${escape(id)}">${escape(label)}</a></li>`).join('');
  const sidebar = page === 'guides' || guideChapters[page]
    ? guideSidebar(lang, page, from)
    : `<aside aria-label="${locales[lang].contents}"><p>${locales[lang].contents}</p><ul>${toc}</ul></aside>`;
  return `<div class="docs-layout">${sidebar}<article class="prose">${body}</article></div>`;
}

function guideSidebar(lang, page, from) {
  const label = locales[lang].guideNav;
  const overview = [locales[lang].guides];
  const menu = [['guides', overview], ...Object.entries(guideChapters).map(([path, labels]) => [path, labels[lang]])];
  const links = menu.map(([path, [name]]) => {
    const current = path === page ? ' aria-current="page"' : '';
    // Old external bookmarks can still locate the corresponding chapter link.
    const legacyId = page === 'guides' && path !== page ? ` id="${escape(headingId(name))}"` : '';
    return `<li${legacyId}><a href="${url(from, route(lang, path))}"${current}>${escape(name)}</a></li>`;
  }).join('');
  return `<aside class="guide-menu" aria-label="${label}"><p>${label}</p><ul>${links}</ul></aside>`;
}

const ogLocales = { en: 'en_US', 'zh-Hans': 'zh_CN' };

function structuredData(lang, page, title, description) {
  const t = locales[lang];
  const canonical = origin + route(lang, page);
  if (!page) {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'livekit-rs',
          url: origin,
          inLanguage: Object.keys(locales),
        },
        {
          '@type': 'SoftwareApplication',
          name: 'livekit-rs',
          url: canonical,
          description,
          applicationCategory: 'DeveloperApplication',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
          license,
          codeRepository: repository,
        },
      ],
    };
  }
  const crumbs = [[route(lang, ''), t.home]];
  const section = page.split('/')[0];
  if (page !== section) crumbs.push([route(lang, section), t[section]]);
  crumbs.push([route(lang, page), title.split(' | ')[0]]);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(([path, name], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: origin + path,
    })),
  };
}

function shell(lang, page, body) {
  const t = locales[lang];
  const from = route(lang, page);
  const other = lang === 'en' ? 'zh-Hans' : 'en';
  const chapter = guideChapters[page]?.[lang];
  const title = page ? `${chapter?.[0] ?? t[page] ?? tutorials[page]} | livekit-rs` : t.homeTitle;
  const description = chapter?.[1] ?? (page === 'guides' ? t.guideDescription : t.description);
  const section = page.split('/')[0];
  const canonical = origin + from;
  const image = `${origin}assets/og-image.png`;
  const assets = url(from, 'assets');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escape(description)}">
<title>${escape(title)}</title>
<link rel="canonical" href="${canonical}">
${Object.keys(locales).map((id) => `<link rel="alternate" hreflang="${id}" href="${origin}${route(id, page)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${origin}${route('en', page)}">
<link rel="icon" href="${assets}favicon.svg" type="image/svg+xml">
<link rel="icon" href="${assets}favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${assets}apple-touch-icon.png">
<meta property="og:site_name" content="livekit-rs">
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="livekit-rs — Real-time media. Built in Rust.">
<meta property="og:locale" content="${ogLocales[lang]}">
<meta property="og:locale:alternate" content="${ogLocales[other]}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${JSON.stringify(structuredData(lang, page, title, description))}</script>
<link rel="stylesheet" href="${assets}site.css">
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header><div class="bar"><a class="brand" href="${url(from, route(lang, ''))}"><span aria-hidden="true">◈</span> livekit-rs</a>
<nav aria-label="${t.nav}">${navigation.map((item) => `<a href="${url(from, route(lang, item))}"${item === page ? ' aria-current="page"' : item === section ? ' aria-current="true"' : ''}>${t[item || 'home']}</a>`).join('')}<a class="github-link" href="${repository}">GitHub <span aria-hidden="true">↗</span></a></nav>
<a class="language" href="${url(from, route(other, page))}" lang="${other}" hreflang="${other}">${locales[other].name}</a></div></header>
<main id="main" class="wrap">${body}</main>
<footer class="wrap"><span>livekit-rs</span><span>${t.footer}</span><div class="footer-links"><a href="${repository}">GitHub</a><a href="${license}">Apache-2.0</a><a href="${issues}">${t.issues}</a></div></footer>
</body>
</html>`;
}

for (const lang of Object.keys(locales)) {
  for (const page of pages) {
    const folder = resolve(output, route(lang, page));
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, 'index.html'), shell(lang, page, page ? await document(lang, page) : home(lang)));
  }
}
await cp(join(site, 'assets'), join(output, 'assets'), { recursive: true });
await cp(join(site, 'evidence'), join(output, 'evidence'), { recursive: true });
await mkdir(join(output, 'downloads'), { recursive: true });
for (const [source, target] of Object.entries(downloads)) {
  await cp(resolve(site, 'content', source), join(output, target));
}
await writeFile(join(output, '.nojekyll'), '');
await cp(join(site, 'assets', 'favicon.ico'), join(output, 'favicon.ico'));
const sitemap = Object.keys(locales).flatMap((lang) => pages.map((page) => {
  const source = page ? join('content', `${page.replaceAll('/', '-')}.${lang}.md`) : 'build.mjs';
  return `  <url><loc>${origin}${route(lang, page)}</loc><lastmod>${lastmod(source)}</lastmod></url>`;
})).join('\n');
await writeFile(join(output, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>\n`);
await writeFile(join(output, 'robots.txt'), `Sitemap: ${origin}sitemap.xml\n`);
