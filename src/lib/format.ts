import type { Lang } from '../i18n/i18n-types';

const THIN_SPACE = ' ';
const UNITS: Record<Lang, { unlimited: string; mb: string; gb: string; decimal: string }> = {
  fr: { unlimited: 'Illimité', mb: 'Mo', gb: 'Go', decimal: ',' },
  en: { unlimited: 'Unlimited', mb: 'MB', gb: 'GB', decimal: '.' },
};

export function formatXof(amount: number): string {
  const digits = String(Math.abs(Math.round(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);

  return `${amount < 0 ? '-' : ''}${digits} F`;
}

/** Prices stay in francs written "5 000 F" in every language, as on the operators' receipts. */
export function formatData(mb: number | null, lang: Lang = 'fr'): string | null {
  const units = UNITS[lang];
  if (mb === null) return null;
  if (mb === -1) return units.unlimited;
  if (mb < 1024) return `${mb} ${units.mb}`;

  const gb = mb / 1024;
  const text = Number.isInteger(gb) ? String(gb) : gb.toFixed(1).replace('.', units.decimal);

  return `${text} ${units.gb}`;
}

export function pricePerGb(priceXof: number | null, mb: number | null): number | null {
  if (priceXof === null || mb === null || mb <= 0) return null;

  return Math.round((priceXof / mb) * 1024);
}
