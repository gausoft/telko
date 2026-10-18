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
/** Build files of previous versions, kept while saved pages may still need them. */
const PREVIOUS_ASSETS_CACHE = 'telko-assets';
/** Requests carrying this header always go to the network: the app is refreshing its saved pages. */
const REFRESH_HEADER = 'X-Telko-Refresh';

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
    keepPreviousShells()
      .then(() => sw.clients.claim())
      .then(() => sw.clients.matchAll())
      .then((clients) => clients.forEach((client) => client.postMessage({ type: 'telko:updated' }))),
  );
});

sw.addEventListener('message', (event) => {
  // Saved pages now match the current build: files of older builds are no longer needed.
  if (event.data?.type === 'telko:synced') event.waitUntil(caches.delete(PREVIOUS_ASSETS_CACHE));
});

sw.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== sw.location.origin) return;
  if (url.pathname.startsWith('/offline/') || request.headers.has(REFRESH_HEADER)) return;

  event.respondWith(request.mode === 'navigate' ? serveSavedPageThenRevalidate(event, url) : serveSavedFileOrFetch(event, url));
});

/** Old shell files move to the previous-assets cache before their cache is deleted. */
async function keepPreviousShells() {
  const previous = await caches.open(PREVIOUS_ASSETS_CACHE);

  for (const key of await caches.keys()) {
    if (!key.startsWith('telko-shell-') || key === SHELL_CACHE) continue;
    const old = await caches.open(key);
    for (const request of await old.keys()) {
      if (!new URL(request.url).pathname.startsWith('/_astro/')) continue;
      const response = await old.match(request);
      if (response) await previous.put(request, response);
    }
    await caches.delete(key);
  }
}

/**
 * @param {FetchEvent} event
 * @param {URL} url
 */
async function serveSavedPageThenRevalidate(event, url) {
  const key = toPath(url.pathname);
  const cached = await caches.match(key, { ignoreSearch: true });
  const refresh = fetch(event.request)
    .then((response) => {
      if (response.ok && !response.redirected && response.type === 'basic') save(event, PAGES_CACHE, key, response.clone());

      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }

  return (await refresh) ?? (await savedCountryHome()) ?? offlinePage();
}

/**
 * @param {FetchEvent} event
 * @param {URL} url
 */
async function serveSavedFileOrFetch(event, url) {
  const cached = await caches.match(event.request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(event.request);
  if (response.ok && url.pathname.startsWith('/_astro/')) save(event, SHELL_CACHE, event.request, response.clone());
  if (response.ok && url.pathname.startsWith('/brands/')) save(event, PAGES_CACHE, event.request, response.clone());

  return response;
}

/**
 * Writing to the cache is best effort: a full disk must never hide a good network answer.
 * @param {FetchEvent} event
 * @param {string} cacheName
 * @param {RequestInfo} key
 * @param {Response} response
 */
function save(event, cacheName, key, response) {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => cache.put(key, response))
      .catch(() => undefined),
  );
}

/** A page never saved, offline: show the saved home of the visitor's country rather than an error. */
async function savedCountryHome() {
  const cache = await caches.open(PAGES_CACHE);
  const home = (await cache.keys()).find((request) => /^\/[a-z]{2}$/.test(new URL(request.url).pathname));

  return home ? cache.match(home) : undefined;
}

function offlinePage() {
  const html =
    '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Telko</title><body style="font-family:system-ui;padding:24px;background:#F5F5FA;color:#12111F">' +
    '<p>Cette page n’est pas encore disponible hors connexion.</p><p><a href="/" style="color:#4B3BFF">Revenir à Telko</a></p>';

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

/**
 * "bienvenue.html" -> "/bienvenue", "index.html" -> "/", "/tg/" -> "/tg": one key per page.
 * @param {string} path
 */
function toPath(path) {
  const clean = `/${path.replace(/^\/+/, '')}`.replace(/(\/index)?\.html$/, '').replace(/\/+$/, '');

  return clean === '' ? '/' : clean;
}

/** @param {string} text */
function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) | 0;

  return (h >>> 0).toString(36);
}
