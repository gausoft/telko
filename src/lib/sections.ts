import type { Category } from './schema';

export interface Section {
  id: string;
  label: string;
  categories: Category[];
}

/** Home tiles and list pages. `frais` is rendered from fees.json, not from categories. */
export const SECTIONS: Section[] = [
  { id: 'internet', label: 'Internet', categories: ['internet'] },
  { id: 'appels', label: 'Appels', categories: ['mixed', 'voice-sms'] },
  { id: 'argent', label: 'Argent', categories: ['mobile-money', 'credit-transfer'] },
  { id: 'factures', label: 'Factures', categories: ['bills'] },
  { id: 'frais', label: 'Frais', categories: [] },
  { id: 'aide', label: 'Aide', categories: ['general', 'useful-numbers'] },
];

export const DURATION_FILTERS = [
  { id: 'jour', label: 'Jour' },
  { id: 'semaine', label: 'Semaine' },
  { id: 'mois', label: 'Mois' },
  { id: 'nuit', label: 'Nuit' },
] as const;

export type DurationFilter = (typeof DURATION_FILTERS)[number]['id'];

export function durationOf(days: number | null, label: string, hasTimeWindow: boolean): DurationFilter {
  if (hasTimeWindow || /nuit/i.test(label)) return 'nuit';
  if (days === null || days <= 1) return 'jour';
  if (days <= 7) return 'semaine';

  return 'mois';
}
