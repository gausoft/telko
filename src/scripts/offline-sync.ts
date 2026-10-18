import { packVersion, savePack } from '../db/catalog-store';
import type { OfflinePack } from '../db/db-types';
import type { Selection, SyncResult } from './offline-sync-types';

export const PAGES_CACHE = 'telko-pages';
const LOCK = 'telko-offline-sync';
const REFRESH_HEADER = { 'X-Telko-Refresh': '1' };

let queue: Promise<unknown> = Promise.resolve();

/**
 * Downloads what the device needs for the chosen country and operators: their pages and catalog,
 * nothing for other operators. Runs one at a time across tabs; the choices are read when the turn comes.
 */
export async function syncOffline(readSelection: () => Selection | null): Promise<SyncResult> {
  const run = (): Promise<SyncResult> => syncNow(readSelection).catch(() => 'skipped' as const);

  if (navigator.locks) return await navigator.locks.request(LOCK, run);

  const next = queue.then(run, run);
  queue = next;

  return next;
}

/** Ready means: the saved catalog matches these exact choices and a service worker serves the pages. */
export async function isOfflineReady(selection: Selection): Promise<boolean> {
  const saved = await packVersion(selection.country).catch(() => null);

  return saved !== null && saved.endsWith(`|${choiceKey(selection.operators)}`) && !!navigator.serviceWorker?.controller;
}

async function syncNow(readSelection: () => Selection | null): Promise<SyncResult> {
  const selection = readSelection();
  if (!selection || !navigator.onLine || !('caches' in window)) return 'skipped';

  const pack = await fetchPack(selection.country);
  if (!pack) return 'skipped';

  const keep = chosenOperators(pack, selection.operators);
  const readyKey = `${pack.version}|${choiceKey(keep)}`;
  if ((await packVersion(selection.country)) === readyKey) return 'ready';

  const files = filesFor(pack, keep);
  if (!(await cacheFiles(files))) return 'partial';
  if (!sameSelection(selection, readSelection())) return 'stale';

  await removeOtherPages(files);
  await savePack({ ...pack, entries: pack.entries.filter((e) => keep.includes(e.operator)) }, readyKey);
  navigator.serviceWorker?.controller?.postMessage({ type: 'telko:synced' });
  await navigator.storage?.persist?.().catch(() => false);

  return 'ready';
}

async function fetchPack(country: string): Promise<OfflinePack | null> {
  try {
    const response = await fetch(`/offline/${country}.json`, { cache: 'no-cache' });

    return response.ok ? ((await response.json()) as OfflinePack) : null;
  } catch {
    return null;
  }
}

function chosenOperators(pack: OfflinePack, operators: string[]): string[] {
  const chosen = operators.filter((o) => pack.operators.includes(o));

  return chosen.length > 0 ? chosen : pack.operators;
}

function choiceKey(operators: string[]): string {
  return [...operators].sort().join(',');
}

export function filesFor(pack: Pick<OfflinePack, 'pages'>, operators: string[]): string[] {
  return [...pack.pages.shared, ...operators.flatMap((o) => pack.pages.byOperator[o] ?? [])];
}

/** Every file is fetched from the network (never from the service worker); a redirect counts as a failure. */
async function cacheFiles(urls: string[]): Promise<boolean> {
  const cache = await caches.open(PAGES_CACHE);
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, { cache: 'no-cache', headers: REFRESH_HEADER });
      if (!response.ok || response.redirected) throw new Error(`${url}: ${response.status}`);
      await cache.put(url, response);
    }),
  );

  return results.every((r) => r.status === 'fulfilled');
}

/** Only after a complete download: pages outside the new choices are removed, so the device keeps what it uses. */
async function removeOtherPages(keep: string[]): Promise<void> {
  const cache = await caches.open(PAGES_CACHE);
  const wanted = new Set(keep);

  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname;
    if (!wanted.has(path) && !path.startsWith('/brands/')) await cache.delete(request);
  }
}

function sameSelection(a: Selection, b: Selection | null): boolean {
  return b !== null && a.country === b.country && choiceKey(a.operators) === choiceKey(b.operators);
}
