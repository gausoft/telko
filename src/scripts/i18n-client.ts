import type { ClientMessages, Lang } from '../i18n/i18n-types';

let cached: ClientMessages | null = null;

/** Texts of the page language, embedded by the layout; read once. */
export function t(): ClientMessages {
  if (cached) return cached;

  const raw = document.querySelector('#i18n-data')?.textContent ?? '{}';
  cached = JSON.parse(raw) as ClientMessages;

  return cached;
}

export function pageLangOf(doc: Document = document): Lang {
  return doc.documentElement.lang === 'en' ? 'en' : 'fr';
}
