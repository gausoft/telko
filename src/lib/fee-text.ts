import type { CatalogFee } from './catalog-types';
import type { FeeWords } from './fee-text-types';
import { formatAmount } from './format';

const RANGE = /^(?:entre|between)\s+(.+?)\s+(?:à|et|and|to)\s+(.+)$/i;

/** The fee itself: the figure when there is one, otherwise the amount written at the end of the label. */
export function feeAmount(fee: CatalogFee, words: FeeWords, decimal: string): string {
  if (fee.fee !== null) return fee.fee === 0 ? words.free : formatAmount(fee.fee, fee.amountLabel);
  if (fee.fee_percent !== null) return `${String(fee.fee_percent).replace('.', decimal)} %`;

  const published = fee.label.split(':')[1]?.trim();
  if (!published || !/\d/.test(published)) return words.unpublished;

  return published.replace(/(\d)\s(?=\d{3}\b)/g, '$1 ').replace(RANGE, '$1 – $2');
}

/** What the fee applies to: the label without its trailing amount. */
export function feeCondition(fee: CatalogFee): string {
  const cut = fee.label.lastIndexOf(':');
  if (cut === -1) return fee.label;

  const suffix = fee.label.slice(cut + 1).trim();

  return plainAmount(fee.amountLabel).test(suffix) ? fee.label.slice(0, cut).trim() : fee.label;
}

/** The part after ":" in a label when it is only an amount ("entre 5 000 et 10 000 F", "between …"). */
function plainAmount(amountLabel: string): RegExp {
  const label = amountLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return new RegExp(`^(gratuit|free|[\\d\\s .,]+\\s?${label}|(?:entre|between) .+)$`, 'i');
}
