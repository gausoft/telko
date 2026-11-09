import type { FeeQuote, FeeRow } from './fee-lookup-types';

/** Amounts people actually search for (« frais 50000 »): each gets its own page. */
export const FEE_PAGE_AMOUNTS = [10000, 15000, 20000, 25000, 30000, 50000, 60000] as const;

/** Largest amount the calculator accepts: the top of the published grids. */
export const MAX_FEE_AMOUNT = 2_000_000;

/**
 * The published fees of one operator whose band contains the amount, grouped in the order the
 * operations are given. Nothing is dropped or computed: a fee without a figure keeps its wording.
 */
export function quoteFor(rows: FeeRow[], operator: string, amount: number, operations: string[]): FeeQuote {
  const own = rows.filter((row) => row.operator === operator && covers(row, amount));
  const groups = operations.map((operation) => ({ operation, rows: own.filter((row) => row.operation === operation) })).filter((group) => group.rows.length > 0);

  return { operator, groups };
}

/** The answer people came for (the withdrawal fee, else the first group) and everything else for the amount. */
export function splitQuote(quote: FeeQuote): { head: FeeQuote['groups'][number] | null; rest: FeeQuote['groups'] } {
  const head = quote.groups.find((group) => group.operation === 'withdrawal') ?? quote.groups[0] ?? null;

  return { head, rest: quote.groups.filter((group) => group !== head) };
}

function covers(row: FeeRow, amount: number): boolean {
  return amount >= row.min && (row.max === null || amount <= row.max);
}

/** Reads what a visitor typed ("50 000", "50000 F"): a whole amount in range, otherwise null. */
export function parseAmount(text: string): number | null {
  const compact = text.replace(/\s/g, '').replace(/f(cfa)?$/i, '');
  const grouped = /^\d{1,3}([.,]\d{3})+$/.test(compact);
  if (!grouped && !/^\d+$/.test(compact)) return null;

  const digits = compact.replace(/[.,]/g, '');

  const amount = Number(digits);

  return amount >= 1 && amount <= MAX_FEE_AMOUNT ? amount : null;
}
