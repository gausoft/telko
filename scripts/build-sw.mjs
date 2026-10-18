// Generates dist/sw.js: the shell precache list is injected into scripts/service-worker.js.
// Only what every visitor needs goes in the shell; country pages and brand images are fetched
// later for the visitor's own country and operators (src/scripts/offline-sync.ts).
import { injectManifest } from 'workbox-build';

const OTHER_SCRIPTS = /-(latin-ext|vietnamese|cyrillic|cyrillic-ext|greek|greek-ext)-/;

const { count, size, warnings } = await injectManifest({
  swSrc: 'scripts/service-worker.js',
  swDest: 'dist/sw.js',
  globDirectory: 'dist',
  globPatterns: [
    '_astro/**/*.{js,css,woff2}',
    'icons/*.png',
    'flags/*.svg',
    'favicon.{svg,ico}',
    'telko-symbol.svg',
    'manifest.webmanifest',
    'index.html',
    'bienvenue/index.html',
  ],
  manifestTransforms: [
    async (entries) => ({ manifest: entries.filter((e) => !(e.url.endsWith('.woff2') && OTHER_SCRIPTS.test(e.url))), warnings: [] }),
  ],
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
});

for (const warning of warnings) console.warn(warning);
console.log(`sw.js: ${count} shell files, ${(size / 1024).toFixed(0)} kB`);
