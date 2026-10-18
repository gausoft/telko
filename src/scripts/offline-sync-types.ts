import type { Lang } from '../i18n/i18n-types';

/** ready: the device has everything for the current choices. stale: the choices changed meanwhile, a newer sync takes over. */
export type SyncResult = 'ready' | 'skipped' | 'partial' | 'stale';

export interface Selection {
  country: string;
  operators: string[];
  /** Language kept offline: the saved choice, not the language of the page being read. */
  lang: Lang;
}
