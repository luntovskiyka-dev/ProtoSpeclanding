# ProtoSpec

Static Russian site for protospec.ru: specs (ТЗ), prompts and rules files for AI coding (Cursor, Claude Code, AGENTS.md). The app at `app.protospec.ru` is a separate project and is not in this repository.

## Commands

```bash
npm install
npm run dev
npm run build
npm test
npx wrangler deploy --dry-run
```

`npm test` rebuilds with `SITE_LIVE` unset, then runs Vitest against `dist/`.

Production indexing, only for the real domain:

```bash
SITE_LIVE=true npm run build
```

The Workers build command is `npm run build`. `wrangler.jsonc` serves `dist/` as static assets. No custom domain or route is configured.

## Stack

Astro, TypeScript, Tailwind. Fully static (`output: 'static'`). `lang="ru"`.

- `trailingSlash: 'never'`
- `build.format: 'file'` so `/cursor` is `dist/cursor.html`
- Workers: `html_handling: "drop-trailing-slash"`, `not_found_handling: "404-page"`, worker name `protospec`

`drop-trailing-slash` answers `/page/` with a 307 to `/page`. That is slash normalization, not the legacy 301 map.

Styling is token-based (`--ps-*` variables in `src/styles/global.css`, mapped into Tailwind). UI typeface is self-hosted Onest Variable; code uses JetBrains Mono Variable (both via `@fontsource-variable/*`, cyrillic + latin only). System stacks stay as fallback. Markdown code blocks are not syntax-highlighted, so they use those same tokens. No third-party scripts, analytics, or font CDNs.

## Indexing

`SITE_LIVE=true` is the only switch.

| | `SITE_LIVE` unset (default) | `SITE_LIVE=true` |
|---|---|---|
| `<meta name="robots">` | `noindex,nofollow` on every page | omitted on published pages |
| `robots.txt` | `Disallow: /` | `Allow: /` and a sitemap line |
| Draft pages | built, `noindex`, absent from the sitemap | same |

A workers.dev preview must be built without `SITE_LIVE`.

## Pages

Content lives in `src/content/pages` (one collection, `kind`: `hub`, `article`, `prompt`, `tool`, `service`). Frontmatter: `title`, `description`, `h1`, `answer`, optional `faq`, `breadcrumbs`, `draft`, plus `query` for the main keyword.

Launch URLs (★ in structure-v1 section 2), all `draft: true` until the text is written:

- `/`
- `/cursor`, `/cursor/rules`
- `/claude-code`, `/claude-code/claude-md`, `/claude-code/besplatno`
- `/agents-md`
- `/zadachi`, `/zadachi/sajt`, `/zadachi/telegram-bot`
- `/prompty`, `/prompty/sozdanie-sajta`, `/prompty/plan-pered-kodom`, `/prompty/ispravlenie-oshibki`, `/prompty/sozdat-agents-md`
- `/tz-dlya-nejroseti`
- `/generator` (empty `#generator-root` mount; the generator is a later task)
- `/blog`, `/blog/kak-napisat-prompt-dlya-cursor`, `/blog/besplatnye-nejroseti-dlya-programmirovaniya`
- `/about`, `/contacts`, `/privacy`

Also kept, and still a draft because the old article is not in this repo: `/blog/protospec-vs-structura`.

Draft bodies say «Текст в работе». Hubs list their child pages from the collection. Prompt pages render the frontmatter prompt in a code block with a copy button. Articles get the same button on fenced code blocks.

## SEO head

Shared layout, every page:

- title (max 60 characters) and description (max 155)
- one canonical, `https://protospec.ru` + path, home without a trailing slash
- Open Graph title, description, url, type, locale, site name
- JSON-LD: `WebSite` + `Organization` on `/`; `BreadcrumbList` on nested pages; `Article` on articles; `FAQPage` only when `faq` is set
- verification tags, kept exactly:

```html
<meta name="google-site-verification" content="HGLuk5E2vjZSE0XWKHptdUI-Hz-LrpsJn_g4AVJCjBQ">
<meta name="yandex-verification" content="fae2a0271da586e0">
```

The sitemap is generated from the collection and includes a URL only when `draft` is false.

## Redirects

Not implemented. The section 4 map, including both forms of the Cyrillic URL, is in `docs/redirects.pending.txt` and explained in `docs/redirects.md`.

## Readings of structure-v1

- Section 2/3 is the URL source. Wave 2 paths are not created. `/claude-code/besplatno` was approved for launch after that document and is not in its ★ list.
- «19 content pages + 3 service pages» are the ★ URLs. `/blog/protospec-vs-structura` is the extra kept URL from the same section. It has no H1 in section 3; the stub H1 is «ProtoSpec и Structura: в чём разница».
- Service H1s are split from the combined section 3 row: «О проекте», «Контакты и реквизиты», «Политика конфиденциальности».
- Title tags are shortened so they stay within 60 characters. Visible H1s match section 3.
- `/zadachi/sajt` and `/zadachi/telegram-bot` use the article layout (guide plus a file block).
- No FAQ items yet: section 3 asks for real questions from `serp-research.md`, which is not in this repo.
- Article JSON-LD uses the organization ProtoSpec as author. A personal byline is still an open question in section 6.
- Pages whose main query is «частота не снята» keep that phrase in frontmatter. `/blog`, `/about`, `/contacts` and `/privacy` have no main query in section 3.
- The home link is `href="/"`. Every other internal path has no trailing slash. The home canonical is `https://protospec.ru`.
