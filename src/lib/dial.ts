import type { Entry } from './schema';

/**
 * Returns a tel: link for codes that need no user input. Codes with parameters
 * (amount, phone number, PIN) are built by a form, never linked directly.
 */
export function telHref(entry: Pick<Entry, 'ussd'>): string | null {
  if (entry.ussd.params.length > 0) return null;

  return `tel:${encodeUssd(entry.ussd.template)}`;
}

export function encodeUssd(code: string): string {
  return code.replace(/#/g, '%23');
}
