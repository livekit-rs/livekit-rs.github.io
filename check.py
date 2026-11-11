"""Check the exact public artifact at the custom domain and at a project prefix."""

import json
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit

DIST = Path(__file__).resolve().parent / "dist"
ROOT = DIST.parent
PAGE_ROUTES = ("", "guides/", "cli/", "sdk/", "sdk/react/", "sdk/android/", "sdk/ios/", "sdk/flutter/", "compatibility/")
LOCALES = {"": "en", "zh-hans/": "zh-Hans"}
FORBIDDEN = re.compile(r"livekit-platform|livekit-docs|netonlive|spec-?0078", re.I)


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.lang = None
        self.ids = set()
        self.refs = []
        self.headings = 0
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.lang = attrs.get("lang")
        if tag == "h1":
            self.headings += 1
        if "id" in attrs:
            assert attrs["id"] not in self.ids, attrs["id"]
            self.ids.add(attrs["id"])
        if "href" in attrs:
            self.refs.append(attrs["href"])


for path in [ROOT / "README.md", *DIST.rglob("*")]:
    if path.is_file():
        assert not FORBIDDEN.search(path.read_text()), f"Private project reference in {path}"

for locale, language in LOCALES.items():
    for route in PAGE_ROUTES:
        relative_route = locale + route
        page = Page(DIST / relative_route / "index.html")
        assert page.lang == language and page.headings == 1 and "main" in page.ids
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
