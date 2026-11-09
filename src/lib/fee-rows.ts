import type { CatalogFee } from './catalog-types';
import { feeAmount, feeCondition } from './fee-text';
import type { FeeWords } from './fee-text-types';
import type { FeeRow } from './fee-lookup-types';

/** Words the fees of a country, in the language of the page, so the browser never has to format anything. */
export function toFeeRows(fees: CatalogFee[], words: FeeWords, decimal: string): FeeRow[] {
  return fees.map((fee) => ({
    operator: fee.operator,
    operation: fee.operation,
    condition: feeCondition(fee),
    amount: feeAmount(fee, words, decimal),
    min: fee.min,
    max: fee.max,
  }));
}
