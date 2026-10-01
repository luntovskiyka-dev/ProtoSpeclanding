# AGENTS.md

Hard rules for this repository. They override convenience.

- URLs never end with a slash. Astro `trailingSlash` is `never` and `build.format` is `file`. The only internal `href` that is exactly `/` is the home page. Do not link to `/cursor/` or any other path with a trailing slash.
- Every page has one canonical: `https://protospec.ru` plus the path, with no trailing slash. The home canonical is `https://protospec.ru`.
- The sitemap lists only canonical, indexable 200 pages. Drafts, the 404 page, `robots.txt` and the sitemap URL itself stay out. Sitemap locations do not end with a slash.
- `draft: true` pages are built so the tree is navigable, but they are excluded from the sitemap and always emit `noindex,nofollow`, even when `SITE_LIVE=true`.
- `SITE_LIVE=true` is the only indexing switch. When it is unset, every page emits `<meta name="robots" content="noindex,nofollow">` and `robots.txt` disallows all. Do not set it for a workers.dev preview.
- No third-party scripts, analytics, or external fonts/CDNs. The font stack stays on the system fonts. Copy-to-clipboard is a tiny inline script in the base layout.
- These verification tags stay in the shared base layout, byte for byte:

```html
<meta name="google-site-verification" content="HGLuk5E2vjZSE0XWKHptdUI-Hz-LrpsJn_g4AVJCjBQ">
<meta name="yandex-verification" content="fae2a0271da586e0">
```

- Do not implement the section 4 redirect map by dropping a file into `public/_redirects`. The pending rules live in `docs/redirects.pending.txt`. The Cyrillic legacy URL needs both the raw and the percent-encoded form.
- `app.protospec.ru` is a separate app. Link to it; do not build it here.
- Do not add a custom domain or route to `wrangler.jsonc`.
- `lang` is `ru`. Page titles stay within 60 characters and descriptions within 155. H1s for launch pages match structure-v1 section 3.
- Do not invent FAQ entries. `FAQPage` JSON-LD is emitted only when frontmatter has a `faq` list of real questions.
- Wave 2 URLs (`/instrumenty`, `/cursor/rules/python`, `/prompty/code-review`, and the rest without ★) are not created as empty pages.
