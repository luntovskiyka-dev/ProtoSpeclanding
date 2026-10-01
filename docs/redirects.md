# 301 redirects (not active)

The map from structure-v1 section 4 is **not implemented**. Nothing in `public/` or `dist/` should redirect these URLs yet.

When the redirect task starts, copy `docs/redirects.pending.txt` to `public/_redirects` so Astro emits it into the Workers assets directory. Cloudflare Workers static assets read `_redirects` from that directory. Do not add the rules to `wrangler.jsonc`.

Trailing slashes are a separate mechanism. `wrangler.jsonc` sets `assets.html_handling` to `drop-trailing-slash`, which answers `/page/` with **307** to `/page`. That is not a substitute for the section 4 map, and it is not a 301.

## URLs that stay

| Old URL | New URL |
|---|---|
| `/` | `/` |
| `/blog` | `/blog` |
| `/blog/kak-napisat-prompt-dlya-cursor` | same |
| `/blog/protospec-vs-structura` | same |
| `/contacts` | `/contacts` (canonical must be this page, not `/`) |

## URLs that will 301

| Old URL | New URL |
|---|---|
| `/guide` | `/zadachi/sajt` |
| `/blog/ot-prototipa-do-koda-dlya-pm` | `/zadachi/sajt` |
| `/blog/chto-takoe-strukturirovannoe-tz` | `/tz-dlya-nejroseti` |
| `/blog/kak-veb-studii-avtomatiziruyut-tz` | `/tz-dlya-nejroseti` |
| `/faq` | `/about` |
| `/blog/лучшие-бесплатные-инструменты-ai-разработки-2026` | `/blog/besplatnye-nejroseti-dlya-programmirovaniya` |

The Cyrillic URL has to be listed **twice** in `_redirects`: once as raw UTF-8 and once percent-encoded. Some clients and caches send only one of the forms. The encoded form is:

`/blog/%D0%BB%D1%83%D1%87%D1%88%D0%B8%D0%B5-%D0%B1%D0%B5%D1%81%D0%BF%D0%BB%D0%B0%D1%82%D0%BD%D1%8B%D0%B5-%D0%B8%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BC%D0%B5%D0%BD%D1%82%D1%8B-ai-%D1%80%D0%B0%D0%B7%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%BA%D0%B8-2026`

`app.protospec.ru` is a different host and is not part of this map.
