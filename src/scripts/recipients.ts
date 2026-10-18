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
  try {
    await db.recipients.put({ key: `${recipient.country}:${recipient.number}`, ...recipient, usedAt: now, updatedAt: now });
    const extra = await db.recipients.orderBy('usedAt').reverse().offset(MAX).primaryKeys();
    await db.recipients.bulkDelete(extra);
  } catch {
    // Without IndexedDB (rare private modes) recipients are simply not kept.
  }
}

export async function clearRecipients(): Promise<void> {
  await db.recipients.clear();
}

/** Numbers saved by the first version (localStorage) move to the database once. */
async function migrateLegacy(): Promise<void> {
  let raw: unknown = [];
  try {
    raw = JSON.parse(window.localStorage.getItem(LEGACY_KEY) ?? '[]');
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    return;
  }
  if (!Array.isArray(raw)) return;

  const valid = raw.filter(isRecipient).reverse();
  for (const [i, recipient] of valid.entries()) await rememberRecipient(recipient, Date.now() - valid.length + i);
}

function isRecipient(value: unknown): value is Recipient {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  return typeof v['country'] === 'string' && typeof v['number'] === 'string' && /^\d{6,15}$/.test(v['number']);
}
