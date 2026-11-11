# Website

The site defaults to English and serves Simplified Chinese at `/zh-hans/`. The language switch opens the same page in the other language. Localized guide sources are in [content](content).

Run these commands from the repository root.

```sh
npm ci --ignore-scripts
npm run build
npm test
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

## GitHub Pages

In the repository's **Settings → Pages**, select **GitHub Actions** as the build source. Add `livekit-rs.com` as the custom domain after verifying domain ownership. Then configure the apex DNS records and enable HTTPS when GitHub issues the certificate. The relative navigation also works at the default GitHub Pages organization URL.

The Website workflow builds and checks the static site, then publishes `dist` on `main`. The artifact includes the six localized pages, styles, public deployment examples, and selected comparison evidence. See the [GitHub Pages custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
