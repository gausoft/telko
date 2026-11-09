/** Show operator and mobile money logos. When false, brand badges are shown instead. */
export const SHOW_BRAND_LOGOS = true;

/** Country used when the visitor has not picked one yet. */
export const DEFAULT_COUNTRY = 'tg';

/** Public repository, where contributions and sources live. */
export const REPO_URL = 'https://github.com/gausoft/telko';

/** Address that receives proposed codes (POST, JSON). Empty: the assistant falls back to a prefilled GitHub issue. Set PUBLIC_SUBMISSION_ENDPOINT at build time, e.g. /api/contribute. */
export const SUBMISSION_ENDPOINT: string = import.meta.env.PUBLIC_SUBMISSION_ENDPOINT ?? '';

/** Public Turnstile site key. Empty: no anti-bot widget is shown. Set PUBLIC_TURNSTILE_SITEKEY at build time. */
export const TURNSTILE_SITEKEY: string = import.meta.env.PUBLIC_TURNSTILE_SITEKEY ?? '';

/** Delay between two slides of the featured carousel, in milliseconds. */
export const CAROUSEL_INTERVAL_MS = 4000;

/** Keys used to remember the visitor's choices in the browser. */
export const STORAGE_KEYS = {
  country: 'telko.country',
  operator: 'telko.operator',
  operators: 'telko.operators',
  onboarded: 'telko.onboarded',
  theme: 'telko.theme',
  lang: 'telko.lang',
} as const;
