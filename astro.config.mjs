import { defineConfig } from 'astro/config';

export default defineConfig({
  // Canonical address of every page, share image and sitemap entry. Becomes https://telko.africa once the domain is bought.
  site: 'https://telko.pages.dev',
  output: 'static',
  trailingSlash: 'never',
  // tg.html rather than tg/index.html: Cloudflare Pages serves it at /tg without redirecting to /tg/.
  build: { format: 'file' },
});
