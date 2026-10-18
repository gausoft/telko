import type { Recipient } from './recipients-types';

const KEY = 'telko.recipients';
const MAX = 5;

/** Last phone numbers typed in the code assistant, kept on this device only. Never amounts or secret codes. */
export function readRecipients(): Recipient[] {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');

    return Array.isArray(raw) ? raw.filter(isRecipient) : [];
  } catch {
    return [];
  }
}

export function rememberRecipient(recipient: Recipient): void {
  const next = [recipient, ...readRecipients().filter((r) => r.number !== recipient.number || r.country !== recipient.country)].slice(0, MAX);
  write(next);
}

export function clearRecipients(): void {
  write([]);
}

function write(list: Recipient[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage can be unavailable (private mode); recipients are a convenience only.
  }
}

function isRecipient(value: unknown): value is Recipient {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  return typeof v['country'] === 'string' && typeof v['number'] === 'string' && /^\d{6,15}$/.test(v['number']);
}
