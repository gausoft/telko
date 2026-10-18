import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://telko.africa',
  output: 'static',
  trailingSlash: 'never',
  // tg.html rather than tg/index.html: Cloudflare Pages serves it at /tg without redirecting to /tg/.
  build: { format: 'file' },
});
