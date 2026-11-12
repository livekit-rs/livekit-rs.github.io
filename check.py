"""Check the exact public artifact at the custom domain and at a project prefix."""

import json
from html.parser import HTMLParser
from pathlib import Path
import re
import struct
from xml.etree import ElementTree
from urllib.parse import unquote, urljoin, urlsplit

DIST = Path(__file__).resolve().parent / "dist"
ROOT = DIST.parent
GUIDE_ROUTES = (
    "guides/", "guides/concepts/", "guides/build-locally/", "guides/connect-sdk/",
    "guides/deploy/", "guides/configuration/", "guides/migration/", "guides/troubleshooting/",
)
PAGE_ROUTES = ("", "cli/", "sdk/", "sdk/react/", "sdk/android/", "sdk/ios/", "sdk/flutter/", "compatibility/", *GUIDE_ROUTES)
LOCALES = {"": "en", "zh-hans/": "zh-Hans"}
ORIGIN = "https://livekit-rs.com/"
FORBIDDEN = re.compile(r"livekit-platform|livekit-docs|netonlive|spec-?0078", re.I)
HOME_TITLES = {
    "en": "livekit-rs — Rust WebRTC Server, LiveKit Compatible",
    "zh-Hans": "livekit-rs — Rust 开源 WebRTC 服务器，兼容 LiveKit",
}
OG_LOCALES = {"en": "en_US", "zh-Hans": "zh_CN"}


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.lang = None
        self.ids = set()
        self.refs = []
        self.headings = 0
        self.in_guide_menu = False
        self.guide_links = []
        self.canonical = None
        self.alternates = {}
        self.meta = {}
        self.icons = []
        self.jsonld = []
        self.title = None
        self.in_title = False
        self.in_ld = False
        self.ld_buffer = ""
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.lang = attrs.get("lang")
        if tag == "title":
            self.in_title = True
        if tag == "meta":
            key = attrs.get("property") or attrs.get("name")
            if key:
                self.meta[key] = attrs.get("content")
        if tag == "link" and attrs.get("rel") in ("icon", "apple-touch-icon"):
            self.icons.append(attrs)
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.in_ld = True
            self.ld_buffer = ""
        if tag == "aside":
            self.in_guide_menu = attrs.get("class") == "guide-menu"
        if tag == "a" and self.in_guide_menu:
            self.guide_links.append((attrs["href"], attrs.get("aria-current")))
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs["href"]
        if tag == "link" and attrs.get("rel") == "alternate":
            self.alternates[attrs["hreflang"]] = attrs["href"]
        if tag == "h1":
            self.headings += 1
        if "id" in attrs:
            assert attrs["id"] not in self.ids, attrs["id"]
            self.ids.add(attrs["id"])
        if "href" in attrs:
            self.refs.append(attrs["href"])

    def handle_data(self, data):
        if self.in_title:
            self.title = (self.title or "") + data
        if self.in_ld:
            self.ld_buffer += data

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.in_ld:
            self.in_ld = False
            self.jsonld.append(json.loads(self.ld_buffer))
        if tag == "aside":
            self.in_guide_menu = False


for path in [ROOT / "README.md", *DIST.rglob("*")]:
    if path.is_file():
        try:
            text = path.read_text()
        except UnicodeDecodeError:
            continue  # binary image assets carry no text references
        assert not FORBIDDEN.search(text), f"Private project reference in {path}"

for locale, language in LOCALES.items():
    for route in PAGE_ROUTES:
        relative_route = locale + route
        page = Page(DIST / relative_route / "index.html")
        assert page.lang == language and page.headings == 1 and "main" in page.ids
        assert page.canonical == f"{ORIGIN}{relative_route}"
        assert page.alternates == {
            "en": f"{ORIGIN}{route}",
            "zh-Hans": f"{ORIGIN}zh-hans/{route}",
            "x-default": f"{ORIGIN}{route}",
        }
        if route == "":
            assert page.title == HOME_TITLES[language]
        assert page.meta["og:title"] == page.title
        assert page.meta["og:description"] == page.meta["description"]
        assert page.meta["og:url"] == page.canonical
        assert page.meta["og:image"] == f"{ORIGIN}assets/og-image.png"
        assert page.meta["og:locale"] == OG_LOCALES[language]
        assert page.meta["twitter:card"] == "summary_large_image"
        assert page.meta["twitter:image"] == page.meta["og:image"]
        assert any(icon.get("type") == "image/svg+xml" for icon in page.icons)
        assert any(icon.get("rel") == "apple-touch-icon" for icon in page.icons)
        assert len(page.jsonld) == 1
        graph = page.jsonld[0].get("@graph", [page.jsonld[0]])
        types = {node["@type"] for node in graph}
        if route == "":
            assert types == {"WebSite", "SoftwareApplication"}
        else:
            assert types == {"BreadcrumbList"}
            items = graph[0]["itemListElement"]
            assert [item["position"] for item in items] == list(range(1, len(items) + 1))
            assert items[0]["item"] == f"{ORIGIN}{locale}"
            assert items[-1]["item"] == page.canonical
        if route in GUIDE_ROUTES:
            links = [
                (urljoin(page.canonical, href), current)
                for href, current in page.guide_links
            ]
            assert links == [
                (f"{ORIGIN}{locale}{target}", "page" if target == route else None)
                for target in GUIDE_ROUTES
            ], (relative_route, links)
        for prefix in ("", "livekit-rs/"):
            base = f"https://example.test/{prefix}{relative_route}"
            for href in page.refs:
                if urlsplit(href).scheme:
                    continue
                resolved = urlsplit(urljoin(base, href))
                path = unquote(resolved.path).lstrip("/")
                assert path.startswith(prefix), (base, href)
                target = DIST / path.removeprefix(prefix)
                if target.is_dir():
                    target /= "index.html"
                assert target.is_file(), (base, href)
                if resolved.fragment:
                    assert unquote(resolved.fragment) in Page(target).ids, (base, href)

for locale in LOCALES:
    home = (DIST / locale / "index.html").read_text()
    assert 'class="open-source"' not in home
    assert 'Apache-2.0' not in home.split("</main>")[0]

sitemap = ElementTree.parse(DIST / "sitemap.xml")
locations = [loc.text for loc in sitemap.findall(".//{*}loc")]
assert sorted(locations) == sorted(f"{ORIGIN}{locale}{page}" for locale in LOCALES for page in PAGE_ROUTES)
entries = sitemap.findall(".//{*}url")
assert len(entries) == len(locations)
for entry in entries:
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", entry.find("{*}lastmod").text)
assert (DIST / "robots.txt").read_text() == f"Sitemap: {ORIGIN}sitemap.xml\n"


def png_size(path):
    header = path.read_bytes()[:24]
    assert header[:8] == b"\x89PNG\r\n\x1a\n"
    return struct.unpack(">II", header[16:24])


assert png_size(DIST / "assets/og-image.png") == (1200, 630)
assert png_size(DIST / "assets/apple-touch-icon.png") == (180, 180)
assert png_size(DIST / "assets/favicon-32.png") == (32, 32)
assert (DIST / "favicon.ico").is_file()

TUTORIAL_EXAMPLES = {
    "react": "FirstCall.jsx",
    "android": "MainActivity.kt",
    "ios": "ContentView.swift",
    "flutter": "main.dart",
}

for tutorial, filename in TUTORIAL_EXAMPLES.items():
    assert (DIST / "downloads" / filename).read_bytes() == (ROOT / "examples" / filename).read_bytes()
    for locale in LOCALES:
        route = f"{locale}sdk/{tutorial}/"
        page = (DIST / route / "index.html").read_text()
        assert f'/downloads/{filename}" download>' in page
        alternate = "zh-hans/" if locale == "" else ""
        assert f'https://livekit-rs.com/{alternate}sdk/{tutorial}/"' in page
        assert "lk token create --join --room demo" in page

receipt = json.loads((DIST / "evidence/nat-recovery-2026-11-11.json").read_text())
cases = {**receipt["initial_cases"], **receipt["repeat_cases"]}
for side, expected in (("go", (4, 4)), ("rust", (3, 4))):
    results = [case["result"] for name, case in cases.items() if name.startswith(side)]
    assert (results.count("pass"), len(results)) == expected
assert cases["rust-single"]["result"] == "initial_join_failed"
assert not cases["rust-single"]["blackout_executed"]
for side in ("go", "rust"):
    assert receipt["physical_interface_control"]["counts"][side] == {"passed": 4, "failed": 0}
for path in (DIST / "compatibility/index.html", DIST / "zh-hans/compatibility/index.html"):
    html = path.read_text()
    assert "<td>4/4</td>" in html and "<td>3/4</td>" in html

print("Localized pages, both hosting paths, all internal links, and published evidence verified.")
