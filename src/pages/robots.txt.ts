import type { APIRoute } from 'astro';
import { isSiteLive, robotsTxt } from '../lib/seo';

export const prerender = true;

export const GET: APIRoute = () => {
  return new Response(robotsTxt(isSiteLive()), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
