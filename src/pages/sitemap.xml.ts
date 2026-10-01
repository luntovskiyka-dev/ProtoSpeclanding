import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { canonicalUrl, pagePath, sitemapXml } from '../lib/seo';

export const prerender = true;

/** Canonical, non-draft pages only. 404, drafts, robots.txt and this file are omitted. */
export const GET: APIRoute = async () => {
  const pages = await getCollection('pages');
  const urls = pages
    .filter((page) => page.data.draft === false)
    .map((page) => canonicalUrl(pagePath(page.id)));

  return new Response(sitemapXml(urls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
