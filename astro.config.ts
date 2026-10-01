import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { rehypeCopyButton } from './src/lib/rehype-copy-button';

export default defineConfig({
  site: 'https://protospec.ru',
  trailingSlash: 'never',
  output: 'static',
  build: {
    format: 'file',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // Plain code blocks follow the CSS color tokens. A highlighter theme can be added with the design.
    syntaxHighlight: false,
    processor: unified({
      smartypants: false,
      rehypePlugins: [rehypeCopyButton],
    }),
  },
});
