import { en } from './en';
import { fr } from './fr';
import type { ClientMessages, Lang, Messages } from './i18n-types';

const DICTIONARIES: Record<Lang, Messages> = { fr, en };

/** Interface texts for a page. Only the build imports this: browser scripts read the embedded subset. */
export function messages(lang: Lang): Messages {
  return DICTIONARIES[lang];
}

/** Serialized into the page for browser scripts; "<" is escaped so text can never close the script tag. */
export function clientMessagesJson(lang: Lang): string {
  const client: ClientMessages = DICTIONARIES[lang].client;

  return JSON.stringify(client).replace(/</g, '\\u003c');
}
