import { db } from '../db/db';
import type { Recipient } from './recipients-types';

const MAX = 5;
const LEGACY_KEY = 'telko.recipients';

/** Last phone numbers typed in the code assistant, kept on this device only. Never amounts or secret codes. */
export async function readRecipients(): Promise<Recipient[]> {
  try {
    await migrateLegacy();
    const rows = await db.recipients.orderBy('usedAt').reverse().limit(MAX).toArray();

    return rows.map(({ country, number }) => ({ country, number }));
  } catch {
    return [];
  }
}

export async function rememberRecipient(recipient: Recipient, now: number = Date.now()): Promise<void> {
  await rememberAll([{ ...recipient, usedAt: now }]).catch(() => undefined);
}

/** Adding and trimming to the last five happen in one transaction, so two tabs never delete each other's numbers. */
async function rememberAll(items: (Recipient & { usedAt: number })[]): Promise<void> {
  await db.transaction('rw', db.recipients, async () => {
    for (const item of items) await db.recipients.put({ key: `${item.country}:${item.number}`, ...item, updatedAt: item.usedAt });
    const extra = await db.recipients.orderBy('usedAt').reverse().offset(MAX).primaryKeys();
    await db.recipients.bulkDelete(extra);
  });
}

export async function clearRecipients(): Promise<void> {
  await db.recipients.clear();
}

/** Numbers saved by the first version (localStorage) move to the database; the old copy goes only once the write succeeded. */
async function migrateLegacy(): Promise<void> {
  let raw: unknown;
  try {
    raw = JSON.parse(window.localStorage.getItem(LEGACY_KEY) ?? 'null');
  } catch {
    return;
  }
  if (!Array.isArray(raw)) return;

  const valid = raw.filter(isRecipient);
  const now = Date.now();
  await rememberAll(valid.map((r, i) => ({ ...r, usedAt: now - i })));
  window.localStorage.removeItem(LEGACY_KEY);
}

function isRecipient(value: unknown): value is Recipient {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  return typeof v['country'] === 'string' && typeof v['number'] === 'string' && /^\d{6,15}$/.test(v['number']);
}
