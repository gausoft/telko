// @ts-check
/// <reference lib="webworker" />
/* Telko service worker. scripts/build-sw.mjs injects the shell file list below (Workbox injection point). */

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

/** @type {{ url: string, revision: string | null }[]} */
// @ts-ignore: replaced by the file list at build time
const SHELL = self.__WB_MANIFEST;
const SHELL_CACHE = `telko-shell-${hash(SHELL.map((e) => `${e.url}@${e.revision ?? ''}`).join('|'))}`;
/** Country pages and brand images, filled by the app for the visitor's choices (src/scripts/offline-sync.ts). */
const PAGES_CACHE = 'telko-pages';

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL.map((e) => new Request(toPath(e.url), { cache: 'reload' }))))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('telko-shell-') && k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim())
      .then(() => sw.clients.matchAll())
      .then((clients) => clients.forEach((client) => client.postMessage({ type: 'telko:updated' }))),
  );
});

sw.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== sw.location.origin) return;
  if (url.pathname.startsWith('/offline/')) return;

  event.respondWith(request.mode === 'navigate' ? page(event, url) : asset(request, url));
});

/**
 * Pages: answer from the device at once, refresh in the background when online.
 * A page never visited and not downloaded falls back to the home screen, which redirects to the saved country.
 * @param {FetchEvent} event
 * @param {URL} url
 */
async function page(event, url) {
  const key = toPath(url.pathname);
  const cached = await caches.match(key, { ignoreSearch: true });
  const refresh = fetch(event.request)
    .then(async (response) => {
      if (response.ok && response.type === 'basic') await (await caches.open(PAGES_CACHE)).put(key, response.clone());

      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }

  return (await refresh) ?? (await caches.match('/')) ?? Response.error();
}

/**
 * Files: from the device first. Hashed build files never change, so they are kept once fetched.
 * @param {Request} request
 * @param {URL} url
 */
async function asset(request, url) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && url.pathname.startsWith('/_astro/')) await (await caches.open(SHELL_CACHE)).put(request, response.clone());
  if (response.ok && url.pathname.startsWith('/brands/')) await (await caches.open(PAGES_CACHE)).put(request, response.clone());

  return response;
}

/**
 * "tg/index.html" -> "/tg", "index.html" -> "/", "/tg/" -> "/tg": one key per page.
 * @param {string} path
 */
function toPath(path) {
  const clean = `/${path.replace(/^\/+/, '')}`.replace(/\/index\.html$/, '').replace(/\/+$/, '');

  return clean === '' ? '/' : clean;
}

/** @param {string} text */
function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) | 0;

  return (h >>> 0).toString(36);
}
