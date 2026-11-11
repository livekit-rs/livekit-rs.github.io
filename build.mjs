import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked, Renderer } from 'marked';

const site = dirname(fileURLToPath(import.meta.url));
const output = join(site, 'dist');
const origin = 'https://livekit-rs.com/';
const locales = {
  en: {
    route: '', name: 'English', home: 'Home', guides: 'Quickstart', cli: 'CLI', sdk: 'SDKs', compatibility: 'Compatibility',
    skip: 'Skip to content', nav: 'Main navigation', contents: 'On this page',
    subtitle: 'Single-node WebRTC server',
    headline: 'Real-time media.\nBuilt in Rust.',
    description: 'A single-node WebRTC server for audio, video, and data, targeting full compatibility with LiveKit Server v1.13.10.',
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
    skip: '跳到正文', nav: '主导航', contents: '本页目录',
    subtitle: '单节点 WebRTC 服务器',
    headline: '实时媒体，\n用 Rust 构建。',
    description: '转发实时音频、视频与数据的单节点 WebRTC 服务器，目标是与 LiveKit Server v1.13.10 完全兼容。',
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
const pages = [...navigation, ...Object.keys(tutorials)];
const pageFiles = new Map(pages.slice(1).map((page) => [page.replaceAll('/', '-'), page]));
const route = (lang, page) => locales[lang].route + (page ? page + '/' : '');
const url = (from, to) => (relative(from || '.', to || '.').split(sep).join('/') || '.') + '/';
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function home(lang) {
  const t = locales[lang];
  const from = route(lang, '');
  return `<section class="hero"><div class="hero-copy">
    <p class="eyebrow">${t.subtitle}</p>
    <h1>${escape(t.headline).replaceAll('\n', '<br>')}</h1>
    <p class="lede">${t.description}</p>
    <div class="actions"><a class="button primary" href="${url(from, route(lang, 'guides'))}">${t.start} <span aria-hidden="true">→</span></a>
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
    const id = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');
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
  return `<div class="docs-layout"><aside aria-label="${locales[lang].contents}"><p>${locales[lang].contents}</p><ul>${toc}</ul></aside><article class="prose">${body}</article></div>`;
}

function shell(lang, page, body) {
  const t = locales[lang];
  const from = route(lang, page);
  const other = lang === 'en' ? 'zh-Hans' : 'en';
  const title = page ? `${t[page] ?? tutorials[page]} | livekit-rs` : 'livekit-rs';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escape(t.description)}">
<title>${title}</title>
<link rel="canonical" href="${origin}${from}">
${Object.keys(locales).map((id) => `<link rel="alternate" hreflang="${id}" href="${origin}${route(id, page)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${origin}${route('en', page)}">
<link rel="stylesheet" href="${url(from, 'assets')}site.css">
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header><div class="bar"><a class="brand" href="${url(from, route(lang, ''))}"><span aria-hidden="true">◈</span> livekit-rs</a>
<nav aria-label="${t.nav}">${navigation.map((item) => `<a href="${url(from, route(lang, item))}"${item === page ? ' aria-current="page"' : item === 'sdk' && tutorials[page] ? ' aria-current="true"' : ''}>${t[item || 'home']}</a>`).join('')}</nav>
<a class="language" href="${url(from, route(other, page))}" lang="${other}" hreflang="${other}">${locales[other].name}</a></div></header>
<main id="main" class="wrap">${body}</main>
<footer class="wrap"><span>livekit-rs</span><span>${t.footer}</span></footer>
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
