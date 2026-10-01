import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const href = z
  .string()
  .refine(
    (value) => value === '/' || (value.startsWith('/') && !value.endsWith('/') && !value.includes('//')),
    'Path must start with / and must not end with a slash',
  );

const crumb = z.object({
  label: z.string().min(1),
  href,
});

const faqItem = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

function baseFields() {
  return {
    title: z.string().min(1).max(60),
    description: z.string().min(1).max(155),
    h1: z.string().min(1),
    answer: z.string().min(1),
    query: z.string().min(1).optional(),
    faq: z.array(faqItem).min(1).optional(),
    breadcrumbs: z.array(crumb).min(1).optional(),
    draft: z.boolean(),
    crumb: z.string().min(1),
    order: z.number().int().nonnegative().default(0),
    nav: z.boolean().default(false),
    inIndex: z.boolean().default(true),
  };
}

const pages = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/pages',
    generateId: ({ entry }) => entry.replace(/\.md$/, '').replaceAll('\\', '/'),
  }),
  schema: z.discriminatedUnion('kind', [
    z.object({ ...baseFields(), kind: z.literal('hub') }),
    z.object({ ...baseFields(), kind: z.literal('article') }),
    z.object({ ...baseFields(), kind: z.literal('prompt'), prompt: z.string().min(1) }),
    z.object({ ...baseFields(), kind: z.literal('tool') }),
    z.object({ ...baseFields(), kind: z.literal('service') }),
  ]),
});

export const collections = { pages };
