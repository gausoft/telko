import type { RecentDial } from './recents-types';

const KEY = 'telko.recents';
const MAX = 6;

export function readRecents(): RecentDial[] {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]');

    return Array.isArray(raw) ? raw.filter(isRecent) : [];
  } catch {
    return [];
  }
}

export function rememberDial(dial: RecentDial): void {
  if (!dial.code) return;

  const next = [dial, ...readRecents().filter((r) => r.code !== dial.code)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode); recents are a convenience only.
  }
}

function isRecent(value: unknown): value is RecentDial {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  return typeof v['code'] === 'string' && typeof v['label'] === 'string' && typeof v['operator'] === 'string';
}
