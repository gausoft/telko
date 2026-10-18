import { db } from './db';
import type { EntryRow, OfflinePack } from './db-types';

const versionKey = (country: string): string => `pack:${country}`;

export async function packVersion(country: string): Promise<string | null> {
  return (await db.meta.get(versionKey(country)))?.value ?? null;
}

/** Replaces the country's catalog in one transaction, so a half-written catalog is never read. */
export async function savePack(pack: OfflinePack, readyKey: string): Promise<void> {
  await db.transaction('rw', db.entries, db.meta, async () => {
    await db.entries.where('country').equals(pack.country).delete();
    await db.entries.bulkPut(pack.entries);
    await db.meta.put({ key: versionKey(pack.country), value: readyKey });
  });
}

export async function entriesByIds(ids: string[]): Promise<EntryRow[]> {
  const rows = await db.entries.bulkGet(ids);

  return rows.filter((r): r is EntryRow => r !== undefined);
}
