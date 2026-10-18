import { packVersion, savePack } from '../db/catalog-store';
import type { OfflinePack } from '../db/db-types';

export const PAGES_CACHE = 'telko-pages';

/**
 * Downloads what the device needs for the chosen country and operators: their pages,
 * brand images and catalog. Nothing for other operators. Does nothing when already up to date.
 */
export async function syncOffline(country: string, operators: string[]): Promise<'ready' | 'skipped' | 'partial'> {
  if (!navigator.onLine || !('caches' in window)) return 'skipped';

  const pack = await fetchPack(country);
  if (!pack) return 'skipped';

  const chosen = operators.filter((o) => pack.operators.includes(o));
  const keep = chosen.length > 0 ? chosen : pack.operators;
  const readyKey = `${pack.version}|${[...keep].sort().join(',')}`;
  if ((await packVersion(country)) === readyKey) return 'ready';

  const ok = await cacheFiles(filesFor(pack, keep));
  await dropOtherOperators(pack, keep);
  if (!ok) return 'partial';

  await savePack({ ...pack, entries: pack.entries.filter((e) => keep.includes(e.operator)) }, readyKey);
  await navigator.storage?.persist?.().catch(() => false);

  return 'ready';
}

export async function isOfflineReady(country: string): Promise<boolean> {
  return (await packVersion(country).catch(() => null)) !== null;
}

async function fetchPack(country: string): Promise<OfflinePack | null> {
  try {
    const response = await fetch(`/offline/${country}.json`, { cache: 'no-cache' });

    return response.ok ? ((await response.json()) as OfflinePack) : null;
  } catch {
    return null;
  }
}

function filesFor(pack: OfflinePack, operators: string[]): string[] {
  return [...pack.pages.shared, ...operators.flatMap((o) => pack.pages.byOperator[o] ?? [])];
}

async function cacheFiles(urls: string[]): Promise<boolean> {
  const cache = await caches.open(PAGES_CACHE);
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      await cache.put(url, response);
    }),
  );

  return results.every((r) => r.status === 'fulfilled');
}

/** Pages of operators the visitor unticked are removed, so the device only keeps what it uses. */
async function dropOtherOperators(pack: OfflinePack, keep: string[]): Promise<void> {
  const cache = await caches.open(PAGES_CACHE);
  const others = pack.operators.filter((o) => !keep.includes(o)).flatMap((o) => pack.pages.byOperator[o] ?? []);
  await Promise.all(others.map((url) => cache.delete(url)));
}
