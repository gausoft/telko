import { db } from './db';
import type { UsageRow } from './db-types';

export interface UseEvent {
  entryId: string;
  country: string;
  operator: string;
}

export async function recordUse(event: UseEvent, now: number = Date.now()): Promise<void> {
  await db.transaction('rw', db.usage, async () => {
    const row = await db.usage.get(event.entryId);
    await db.usage.put({ ...event, count: (row?.count ?? 0) + 1, lastUsedAt: now, updatedAt: now });
  });
}

export async function usageFor(country: string, operator: string): Promise<UsageRow[]> {
  return db.usage.where('[country+operator]').equals([country, operator]).toArray();
}
