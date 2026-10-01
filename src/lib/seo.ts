export const SITE_ORIGIN = 'https://protospec.ru';

export type PageKind = 'hub' | 'article' | 'prompt' | 'tool' | 'service' | 'notfound';

export interface Crumb {
  label: string;
  href: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function isSiteLive(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.SITE_LIVE === 'true';
}

/** Content id (`index`, `cursor/rules`) to a path that never ends with a slash. */
export function pagePath(id: string): string {
  const cleaned = id.replace(/^\/+/, '').replace(/\/+$/, '');
  if (cleaned === '' || cleaned === 'index') return '/';
  return `/${cleaned}`;
}

/** Absolute canonical URL. Home is the origin with no trailing slash. */
export function canonicalUrl(path: string): string {
  const normalized = pagePath(path);
  if (normalized === '/') return SITE_ORIGIN;
  return `${SITE_ORIGIN}${normalized}`;
}

export function parentPath(path: string): string | null {
  const normalized = pagePath(path);
  if (normalized === '/') return null;
  const index = normalized.lastIndexOf('/');
  if (index <= 0) return '/';
  return normalized.slice(0, index);
}

export function shouldNoindex(options: { draft: boolean; siteLive?: boolean }): boolean {
  const live = options.siteLive ?? isSiteLive();
  if (!live) return true;
  return options.draft;
}

export function robotsTxt(siteLive: boolean): string {
  if (!siteLive) {
    return 'User-agent: *\nDisallow: /\n';
  }
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/** Sitemap of canonical URLs only. Callers must pass non-draft 200 pages. */
export function sitemapXml(urls: readonly string[]): string {
  const entries = [...urls]
    .sort()
    .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`);
  const body = entries.length > 0 ? `${entries.join('\n')}\n` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}</urlset>\n`;
}

export interface JsonLdInput {
  path: string;
  description: string;
  h1: string;
  kind: PageKind;
  breadcrumbs?: readonly Crumb[];
  faq?: readonly FaqItem[];
}

export function buildJsonLd(input: JsonLdInput): Record<string, unknown> | null {
  const url = canonicalUrl(input.path);
  const graph: Record<string, unknown>[] = [];

  if (input.path === '/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      name: 'ProtoSpec',
      url: SITE_ORIGIN,
      description: input.description,
      inLanguage: 'ru',
    });
    graph.push({
      '@type': 'Organization',
      '@id': `${SITE_ORIGIN}/#organization`,
      name: 'ProtoSpec',
      url: SITE_ORIGIN,
    });
  }

  if (input.path !== '/' && input.breadcrumbs && input.breadcrumbs.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: input.breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.label,
        item: canonicalUrl(crumb.href),
      })),
    });
  }

  if (input.kind === 'article') {
    graph.push({
      '@type': 'Article',
      headline: input.h1,
      description: input.description,
      inLanguage: 'ru',
      mainEntityOfPage: url,
      url,
      author: {
        '@type': 'Organization',
        name: 'ProtoSpec',
        url: SITE_ORIGIN,
      },
      publisher: {
        '@type': 'Organization',
        name: 'ProtoSpec',
        url: SITE_ORIGIN,
      },
    });
  }

  if (input.faq && input.faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: input.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  if (graph.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}

export const VERIFICATION_TAGS = [
  '<meta name="google-site-verification" content="HGLuk5E2vjZSE0XWKHptdUI-Hz-LrpsJn_g4AVJCjBQ">',
  '<meta name="yandex-verification" content="fae2a0271da586e0">',
].join('\n');

export const ROBOTS_NOINDEX = '<meta name="robots" content="noindex,nofollow">';
