/** Show operator and mobile money logos. When false, brand badges are shown instead. */
export const SHOW_BRAND_LOGOS = true;

/** Country used when the visitor has not picked one yet. */
export const DEFAULT_COUNTRY = 'tg';

/** Delay between two slides of the featured carousel, in milliseconds. */
export const CAROUSEL_INTERVAL_MS = 4000;

/** Keys used to remember the visitor's choices in the browser. */
export const STORAGE_KEYS = {
  country: 'telko.country',
  operator: 'telko.operator',
  operators: 'telko.operators',
  onboarded: 'telko.onboarded',
  theme: 'telko.theme',
} as const;
