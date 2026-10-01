import { describe, expect, it } from 'vitest';
import {
  buildJsonLd,
  canonicalUrl,
  isSiteLive,
  pagePath,
  robotsTxt,
  shouldNoindex,
  sitemapXml,
} from '../src/lib/seo';

describe('canonical URLs', () => {
  it('keeps the home URL free of a trailing slash', () => {
    expect(canonicalUrl('/')).toBe('https://protospec.ru');
    expect(canonicalUrl('')).toBe('https://protospec.ru');
    expect(pagePath('index')).toBe('/');
  });

  it('strips a trailing slash from nested paths', () => {
    expect(canonicalUrl('/cursor/rules/')).toBe('https://protospec.ru/cursor/rules');
    expect(pagePath('cursor/rules')).toBe('/cursor/rules');
  });
});

describe('indexing flag', () => {
  it('noindexes every page when SITE_LIVE is not true', () => {
    expect(shouldNoindex({ draft: false, siteLive: false })).toBe(true);
    expect(shouldNoindex({ draft: true, siteLive: false })).toBe(true);
  });

  it('noindexes drafts even when the site is live', () => {
    expect(shouldNoindex({ draft: true, siteLive: true })).toBe(true);
    expect(shouldNoindex({ draft: false, siteLive: true })).toBe(false);
  });

  it('treats only the exact string true as live', () => {
    expect(isSiteLive({} as NodeJS.ProcessEnv)).toBe(false);
    expect(isSiteLive({ SITE_LIVE: '' } as NodeJS.ProcessEnv)).toBe(false);
    expect(isSiteLive({ SITE_LIVE: 'TRUE' } as NodeJS.ProcessEnv)).toBe(false);
    expect(isSiteLive({ SITE_LIVE: 'true' } as NodeJS.ProcessEnv)).toBe(true);
  });
});

describe('robots.txt', () => {
  it('disallows everything before launch', () => {
    const text = robotsTxt(false);
    expect(text).toContain('Disallow: /');
    expect(text).not.toContain('Sitemap:');
    expect(text).not.toContain('Allow: /');
  });

  it('allows crawling and points at the sitemap when live', () => {
    const text = robotsTxt(true);
    expect(text).toContain('Allow: /');
    expect(text).toContain('Sitemap: https://protospec.ru/sitemap.xml');
    expect(text).not.toContain('Disallow:');
  });
});

describe('sitemap', () => {
  it('emits canonical URLs without a trailing slash', () => {
    const xml = sitemapXml([
      'https://protospec.ru/cursor',
      'https://protospec.ru',
    ]);
    expect(xml).toContain('<loc>https://protospec.ru</loc>');
    expect(xml).toContain('<loc>https://protospec.ru/cursor</loc>');
    expect(xml).not.toMatch(/<loc>[^<]*\/<\/loc>/);
  });
});

describe('JSON-LD', () => {
  it('emits WebSite and Organization on the home page only', () => {
    const data = buildJsonLd({
      path: '/',
      description: 'Описание',
      h1: 'Главная',
      kind: 'hub',
    });
    const graph = graphOf(data);
    expect(graph.map((item) => item['@type'])).toEqual(['WebSite', 'Organization']);
  });

  it('emits BreadcrumbList and Article on a nested article', () => {
    const data = buildJsonLd({
      path: '/cursor/rules',
      description: 'Описание',
      h1: 'Правила',
      kind: 'article',
      breadcrumbs: [
        { label: 'Главная', href: '/' },
        { label: 'Cursor', href: '/cursor' },
        { label: 'Правила', href: '/cursor/rules' },
      ],
    });
    const graph = graphOf(data);
    expect(graph.map((item) => item['@type'])).toEqual(['BreadcrumbList', 'Article']);
    const crumbs = graph[0]?.itemListElement as { item: string }[];
    expect(crumbs.at(-1)?.item).toBe('https://protospec.ru/cursor/rules');
    expect(crumbs[0]?.item).toBe('https://protospec.ru');
  });

  it('emits FAQPage only when the page has a faq list', () => {
    const withoutFaq = buildJsonLd({
      path: '/about',
      description: 'Описание',
      h1: 'О проекте',
      kind: 'service',
      breadcrumbs: [
        { label: 'Главная', href: '/' },
        { label: 'О проекте', href: '/about' },
      ],
    });
    expect(graphOf(withoutFaq).map((item) => item['@type'])).not.toContain('FAQPage');

    const withFaq = buildJsonLd({
      path: '/about',
      description: 'Описание',
      h1: 'О проекте',
      kind: 'service',
      breadcrumbs: [
        { label: 'Главная', href: '/' },
        { label: 'О проекте', href: '/about' },
      ],
      faq: [{ question: 'Где приложение?', answer: 'На app.protospec.ru.' }],
    });
    expect(graphOf(withFaq).map((item) => item['@type'])).toContain('FAQPage');
  });
});

function graphOf(data: Record<string, unknown> | null): Record<string, unknown>[] {
  expect(data).not.toBeNull();
  return (data?.['@graph'] as Record<string, unknown>[]) ?? [];
}
