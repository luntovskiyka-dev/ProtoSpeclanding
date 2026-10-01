import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse, type HTMLElement } from 'node-html-parser';
import { describe, expect, it } from 'vitest';

const dist = path.resolve('dist');
const contentDir = path.resolve('src/content/pages');
const origin = 'https://protospec.ru';

const launchPaths = [
  '/',
  '/cursor',
  '/cursor/rules',
  '/claude-code',
  '/claude-code/claude-md',
  '/claude-code/besplatno',
  '/agents-md',
  '/zadachi',
  '/zadachi/sajt',
  '/zadachi/telegram-bot',
  '/prompty',
  '/prompty/sozdanie-sajta',
  '/prompty/plan-pered-kodom',
  '/prompty/ispravlenie-oshibki',
  '/prompty/sozdat-agents-md',
  '/tz-dlya-nejroseti',
  '/generator',
  '/blog',
  '/blog/kak-napisat-prompt-dlya-cursor',
  '/blog/besplatnye-nejroseti-dlya-programmirovaniya',
  '/blog/protospec-vs-structura',
  '/about',
  '/contacts',
  '/privacy',
];

const articlePaths = [
  '/cursor/rules',
  '/claude-code/claude-md',
  '/claude-code/besplatno',
  '/agents-md',
  '/tz-dlya-nejroseti',
  '/zadachi/sajt',
  '/zadachi/telegram-bot',
  '/blog/kak-napisat-prompt-dlya-cursor',
  '/blog/besplatnye-nejroseti-dlya-programmirovaniya',
  '/blog/protospec-vs-structura',
];

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return [full];
    }),
  );
  return files.flat();
}

function canonicalFromFile(file: string): string {
  const rel = path.relative(dist, file).split(path.sep).join('/');
  if (rel === 'index.html') return origin;
  return `${origin}/${rel.replace(/\.html$/, '')}`;
}

function pathFromContentFile(file: string): string {
  const rel = path.relative(contentDir, file).split(path.sep).join('/').replace(/\.md$/, '');
  return rel === 'index' ? '/' : `/${rel}`;
}

async function contentFiles(): Promise<string[]> {
  return (await walk(contentDir)).filter((file) => file.endsWith('.md'));
}

function draftFlag(source: string): boolean {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter?.[1]) throw new Error('missing frontmatter');
  const draft = frontmatter[1].match(/^draft:\s*(true|false)\s*$/m);
  if (!draft?.[1]) throw new Error('missing draft flag');
  return draft[1] === 'true';
}

function internalPath(href: string): string | null {
  const hashless = href.split('#')[0]?.split('?')[0] ?? '';
  if (!hashless || hashless.startsWith('#')) return null;
  if (hashless.startsWith('/')) return hashless;
  if (hashless.startsWith(origin)) {
    const rest = hashless.slice(origin.length);
    return rest === '' ? '/' : rest;
  }
  return null;
}

function jsonLd(root: HTMLElement): Record<string, unknown> | null {
  const script = root.querySelector('script[type="application/ld+json"]');
  if (!script) return null;
  return JSON.parse(script.text) as Record<string, unknown>;
}

function typesOf(data: Record<string, unknown> | null): string[] {
  const graph = data?.['@graph'];
  if (!Array.isArray(graph)) return [];
  return graph.map((item) => String((item as { '@type'?: string })['@type']));
}

const launchH1: Record<string, string> = {
  '/': 'ТЗ, промпты и правила для разработки с ИИ: Cursor, Claude Code и другие',
  '/cursor': 'Cursor: промпты, правила и шаблоны для реальных проектов',
  '/cursor/rules': 'Правила Cursor: .cursor/rules и .mdc — настройка и готовые примеры',
  '/claude-code': 'Claude Code: CLAUDE.md, промпты и шаблоны под задачи',
  '/claude-code/claude-md': 'CLAUDE.md: что писать, где хранить и 3 готовых шаблона',
  '/claude-code/besplatno': 'Claude Code бесплатно: можно ли пользоваться без оплаты',
  '/agents-md': 'AGENTS.md: что это, примеры файла и как подключить в Cursor, Codex и Claude Code',
  '/tz-dlya-nejroseti': 'ТЗ для нейросети: шаблон технического задания для Cursor и Claude Code',
  '/generator': 'Генератор ТЗ и промпта для Cursor и Claude Code',
  '/zadachi': 'Проекты с ИИ по задачам: сайт, Telegram-бот, CRM',
  '/zadachi/sajt': 'Как сделать сайт с помощью нейросети: от ТЗ до публикации',
  '/zadachi/telegram-bot': 'Telegram-бот с помощью нейросети: ТЗ, промпт и AGENTS.md для aiogram 3',
  '/prompty': 'Промпты для программирования с ИИ-агентами: Cursor, Claude Code, Codex',
  '/prompty/sozdanie-sajta': 'Промпт для создания сайта в Cursor и Claude Code (скопировать)',
  '/prompty/plan-pered-kodom': 'Промпт «сначала план»: чтобы Cursor и Claude Code не писали код вслепую',
  '/prompty/ispravlenie-oshibki': 'Промпт для исправления ошибки: когда агент зациклился на одном фиксе',
  '/prompty/sozdat-agents-md': 'Промпт: пусть агент сам составит AGENTS.md / CLAUDE.md по вашему проекту',
  '/blog': 'Статьи о разработке с ИИ-агентами',
  '/blog/kak-napisat-prompt-dlya-cursor': 'Как писать промпты для Cursor: структура, где писать и готовые шаблоны',
  '/blog/besplatnye-nejroseti-dlya-programmirovaniya':
    'Бесплатные нейросети и ИИ-агенты для программирования: что реально можно сделать',
  '/about': 'О проекте',
  '/contacts': 'Контакты и реквизиты',
  '/privacy': 'Политика конфиденциальности',
};

describe('built HTML', () => {
  it('uses the draft H1 from structure-v1 on every launch page', async () => {
    for (const [urlPath, h1] of Object.entries(launchH1)) {
      const file = urlPath === '/' ? path.join(dist, 'index.html') : path.join(dist, `${urlPath.slice(1)}.html`);
      const root = parse(await readFile(file, 'utf8'));
      expect(root.querySelector('h1')?.text, urlPath).toBe(h1);
      expect(root.toString(), urlPath).toContain('Текст в работе');
    }
  });

  it('links /claude-code/besplatno from the Claude Code hub', async () => {
    const html = await readFile(path.join(dist, 'claude-code.html'), 'utf8');
    expect(html).toContain('href="/claude-code/besplatno"');
    expect(html).not.toContain('/claude-code/besplatno/');
  });

  it('builds every launch URL and the 404 page as extensionless files', async () => {
    const htmlFiles = (await walk(dist)).filter((file) => file.endsWith('.html'));
    const paths = new Set(htmlFiles.map(canonicalFromFile));
    for (const launchPath of launchPaths) {
      const expected = launchPath === '/' ? origin : `${origin}${launchPath}`;
      expect(paths.has(expected), expected).toBe(true);
    }
    expect(paths.has(`${origin}/404`)).toBe(true);
  });

  it('does not ship the pending redirect map', async () => {
    await expect(stat(path.join(dist, '_redirects'))).rejects.toThrow();
  });

  it('keeps internal links free of a trailing slash', async () => {
    const htmlFiles = (await walk(dist)).filter((file) => file.endsWith('.html'));
    const offenders: string[] = [];
    for (const file of htmlFiles) {
      const root = parse(await readFile(file, 'utf8'));
      for (const anchor of root.querySelectorAll('a[href]')) {
        const href = anchor.getAttribute('href');
        if (!href) continue;
        const internal = internalPath(href);
        if (!internal || internal === '/') continue;
        if (internal.endsWith('/')) offenders.push(`${file} -> ${href}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('gives every page exactly one canonical URL without a trailing slash', async () => {
    const htmlFiles = (await walk(dist)).filter((file) => file.endsWith('.html'));
    expect(htmlFiles.length).toBeGreaterThan(0);
    for (const file of htmlFiles) {
      const root = parse(await readFile(file, 'utf8'));
      const canonicals = root.querySelectorAll('link[rel="canonical"]');
      expect(canonicals, file).toHaveLength(1);
      const href = canonicals[0]?.getAttribute('href');
      expect(href, file).toBe(canonicalFromFile(file));
      expect(href?.endsWith('/'), file).toBe(false);
    }
  });

  it('puts both verification tags on the home page', async () => {
    const html = await readFile(path.join(dist, 'index.html'), 'utf8');
    expect(html).toContain(
      '<meta name="google-site-verification" content="HGLuk5E2vjZSE0XWKHptdUI-Hz-LrpsJn_g4AVJCjBQ">',
    );
    expect(html).toContain('<meta name="yandex-verification" content="fae2a0271da586e0">');
    expect(html).toContain('<html lang="ru">');
  });

  it('noindexes every page when the build is not live', async () => {
    const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
    expect(robots).toContain('Disallow: /');
    expect(robots).not.toContain('Sitemap:');
    const htmlFiles = (await walk(dist)).filter((file) => file.endsWith('.html'));
    for (const file of htmlFiles) {
      const html = await readFile(file, 'utf8');
      expect(html, file).toContain('<meta name="robots" content="noindex,nofollow">');
    }
  });

  it('lists only non-draft canonical pages in the sitemap', async () => {
    const xml = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1] ?? '');
    const drafts = new Set<string>();
    const published = new Set<string>();
    for (const file of await contentFiles()) {
      const source = await readFile(file, 'utf8');
      const urlPath = pathFromContentFile(file);
      const canonical = urlPath === '/' ? origin : `${origin}${urlPath}`;
      if (draftFlag(source)) drafts.add(canonical);
      else published.add(canonical);
    }
    expect(drafts.size).toBe(launchPaths.length);
    for (const loc of locs) {
      expect(loc.endsWith('/')).toBe(false);
      expect(drafts.has(loc)).toBe(false);
    }
    expect(locs.sort()).toEqual([...published].sort());
    expect(xml).not.toContain('/404');
  });

  it('adds WebSite and Organization on the home page and Article on articles', async () => {
    const home = parse(await readFile(path.join(dist, 'index.html'), 'utf8'));
    expect(typesOf(jsonLd(home))).toEqual(['WebSite', 'Organization']);

    for (const articlePath of articlePaths) {
      const file = path.join(dist, `${articlePath.slice(1)}.html`);
      const root = parse(await readFile(file, 'utf8'));
      const types = typesOf(jsonLd(root));
      expect(types, articlePath).toContain('BreadcrumbList');
      expect(types, articlePath).toContain('Article');
      expect(types, articlePath).not.toContain('FAQPage');
    }
  });

  it('renders a copy button for every code block and leaves the generator mount empty', async () => {
    const rules = parse(await readFile(path.join(dist, 'cursor/rules.html'), 'utf8'));
    expect(rules.querySelectorAll('pre').length).toBeGreaterThan(0);
    expect(rules.querySelectorAll('[data-copy]')).toHaveLength(rules.querySelectorAll('pre').length);
    expect(rules.querySelector('[data-copy]')?.getAttribute('aria-label')).toBe('Скопировать');

    const prompt = parse(await readFile(path.join(dist, 'prompty/sozdanie-sajta.html'), 'utf8'));
    expect(prompt.querySelectorAll('[data-copy]').length).toBeGreaterThan(0);

    const generator = parse(await readFile(path.join(dist, 'generator.html'), 'utf8'));
    const mount = generator.querySelector('#generator-root');
    expect(mount?.innerHTML.trim()).toBe('');
    expect(generator.toString()).toContain('Генератор ещё не подключён');

    const htmlFiles = (await walk(dist)).filter((file) => file.endsWith('.html'));
    for (const file of htmlFiles) {
      const html = await readFile(file, 'utf8');
      expect(html, file).not.toMatch(/fonts\.googleapis|cdn\.jsdelivr|unpkg\.com/i);
      const root = parse(html);
      for (const script of root.querySelectorAll('script[src]')) {
        expect(script.getAttribute('src') ?? '', file).not.toMatch(/^https?:\/\//);
      }
    }
  });
});
