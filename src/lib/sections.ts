import type { Category } from './schema';

export interface Section {
  id: SectionId;
  categories: Category[];
}

export type SectionId = 'internet' | 'appels' | 'argent' | 'factures' | 'frais' | 'aide';

/** Home tiles and list pages; labels live in the dictionaries. `frais` is rendered from fees.json, not from categories. */
export const SECTIONS: Section[] = [
  { id: 'internet', categories: ['internet'] },
  { id: 'appels', categories: ['mixed', 'voice-sms'] },
  { id: 'argent', categories: ['mobile-money', 'credit-transfer'] },
  { id: 'factures', categories: ['bills'] },
  { id: 'frais', categories: [] },
  { id: 'aide', categories: ['general', 'useful-numbers'] },
];

export const DURATION_FILTERS = ['jour', 'semaine', 'mois', 'nuit'] as const;

export type DurationFilter = (typeof DURATION_FILTERS)[number];

/** Reads the French validity label, the source text: translations never change an offer's period. */
export function durationOf(days: number | null, label: string, hasTimeWindow: boolean): DurationFilter {
  if (hasTimeWindow || /nuit/i.test(label)) return 'nuit';
  if (days === null || days <= 1) return 'jour';
  if (days <= 7) return 'semaine';

  return 'mois';
}
