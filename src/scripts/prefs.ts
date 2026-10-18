import { STORAGE_KEYS } from '../config';

export function readPref(key: keyof typeof STORAGE_KEYS): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEYS[key]);
  } catch {
    return null;
  }
}

export function writePref(key: keyof typeof STORAGE_KEYS, value: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS[key], value);
  } catch {
    // Without storage the visitor simply sees the defaults again next time.
  }
}
