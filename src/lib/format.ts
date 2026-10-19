import type { Lang } from '../i18n/i18n-types';

const THIN_SPACE = ' ';
const UNITS: Record<Lang, { unlimited: string; mb: string; gb: string; decimal: string }> = {
  fr: { unlimited: 'Illimité', mb: 'Mo', gb: 'Go', decimal: ',' },
  en: { unlimited: 'Unlimited', mb: 'MB', gb: 'GB', decimal: '.' },
};

/**
 * An amount as the operator's receipt writes it: "5 000 F" in the CFA franc zone, "5 000 GH₵" elsewhere.
 * `amountLabel` comes from the country file, so a new currency needs no code change.
 */
export function formatAmount(amount: number, amountLabel: string): string {
  const digits = String(Math.abs(Math.round(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);

  return `${amount < 0 ? '-' : ''}${digits} ${amountLabel}`;
}

/** Prices stay in the currency of the country, grouped the same way in every language. */
export function formatData(mb: number | null, lang: Lang = 'fr'): string | null {
  const units = UNITS[lang];
  if (mb === null) return null;
  if (mb === -1) return units.unlimited;
  if (mb < 1024) return `${mb} ${units.mb}`;

  const gb = mb / 1024;
  const text = Number.isInteger(gb) ? String(gb) : gb.toFixed(1).replace('.', units.decimal);

  return `${text} ${units.gb}`;
}

export function pricePerGb(price: number | null, mb: number | null): number | null {
  if (price === null || mb === null || mb <= 0) return null;

  return Math.round((price / mb) * 1024);
}
