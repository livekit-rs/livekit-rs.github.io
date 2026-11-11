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

In the repository's **Settings → Pages**, select **GitHub Actions** as the build source. Add `livekit-rs.com` as the custom domain after verifying domain ownership. Configure apex `A` records for `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`.
To serve the optional `www` alias, point its `CNAME` at `livekit-rs.github.io`.
Enable HTTPS after GitHub confirms DNS and issues the certificate. The relative navigation also works at the default GitHub Pages organization URL.

The Website workflow builds and checks the static site, then publishes `dist` on `main`. The artifact includes the localized quickstart, CLI and SDK guides, downloadable examples, and selected comparison evidence. See the [GitHub Pages custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
