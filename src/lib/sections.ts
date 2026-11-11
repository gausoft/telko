import type { Category } from './schema';

export interface Section {
  id: SectionId;
  categories: Category[];
}

export type SectionId = 'internet' | 'calls' | 'money' | 'bills' | 'fees' | 'help';

/** Home tiles and list pages; labels live in the dictionaries. `frais` is rendered from fees.json, not from categories. */
export const SECTIONS: Section[] = [
  { id: 'internet', categories: ['internet'] },
  { id: 'calls', categories: ['mixed', 'voice-sms'] },
  { id: 'money', categories: ['mobile-money', 'credit-transfer'] },
  { id: 'bills', categories: ['bills'] },
  { id: 'fees', categories: [] },
  { id: 'help', categories: ['general', 'useful-numbers'] },
];

export const DURATION_FILTERS = ['day', 'week', 'month', 'night'] as const;

export type DurationFilter = (typeof DURATION_FILTERS)[number];

/** Tabs of the calls page: an offer goes under the tab of its category, so calls-only bundles never sit among combo ones. */
export const CALL_TABS = ['voice-sms', 'mixed'] as const satisfies readonly Category[];

/** Reads the French validity label, the source text: translations never change an offer's period. */
export function durationOf(days: number | null, label: string, hasTimeWindow: boolean): DurationFilter {
  if (hasTimeWindow || /nuit/i.test(label)) return 'night';
  if (days === null || days <= 1) return 'day';
  if (days <= 7) return 'week';

  return 'month';
}
