import type { CatalogFee } from './catalog-types';
import { formatXof } from './format';

/** Words of the page language for amounts that are not a number. */
export interface FeeWords {
  free: string;
  unpublished: string;
}

/** The part after ":" in a label when it is only an amount, in French or English ("entre 5 000 et 10 000 F", "between …"). */
const PLAIN_AMOUNT = /^(gratuit|free|[\d\s .,]+\s?F|(?:entre|between) .+)$/i;
const RANGE = /^(?:entre|between)\s+(.+?)\s+(?:à|et|and|to)\s+(.+)$/i;

/** The fee itself: the figure when there is one, otherwise the amount written at the end of the label. */
export function feeAmount(fee: CatalogFee, words: FeeWords, decimal: string): string {
  if (fee.fee_xof !== null) return fee.fee_xof === 0 ? words.free : formatXof(fee.fee_xof);
  if (fee.fee_percent !== null) return `${String(fee.fee_percent).replace('.', decimal)} %`;

  const published = fee.label.split(':')[1]?.trim();
  if (!published || !/\d/.test(published)) return words.unpublished;

  return published.replace(/(\d)\s(?=\d{3}\b)/g, '$1 ').replace(RANGE, '$1 – $2');
}

/** What the fee applies to: the label without its trailing amount. */
export function feeCondition(fee: CatalogFee): string {
  const cut = fee.label.lastIndexOf(':');
  if (cut === -1) return fee.label;

  const suffix = fee.label.slice(cut + 1).trim();

  return PLAIN_AMOUNT.test(suffix) ? fee.label.slice(0, cut).trim() : fee.label;
}
