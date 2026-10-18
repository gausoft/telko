const THIN_SPACE = ' ';

export function formatXof(amount: number): string {
  const digits = String(Math.abs(Math.round(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);

  return `${amount < 0 ? '-' : ''}${digits} F`;
}

export function formatData(mb: number | null): string | null {
  if (mb === null) return null;
  if (mb === -1) return 'Illimité';
  if (mb < 1024) return `${mb} Mo`;

  const gb = mb / 1024;
  const text = Number.isInteger(gb) ? String(gb) : gb.toFixed(1).replace('.', ',');

  return `${text} Go`;
}

export function pricePerGb(priceXof: number | null, mb: number | null): number | null {
  if (priceXof === null || mb === null || mb <= 0) return null;

  return Math.round((priceXof / mb) * 1024);
}
