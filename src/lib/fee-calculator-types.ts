import type { BrandView } from './brand-types';
import type { FeeRow } from './fee-lookup-types';

/** What the calculator page embeds for its script: pre-worded rows and the few texts it needs. */
export interface FeeCalculatorData {
  rows: FeeRow[];
  names: { id: string; name: string; brand: BrandView }[];
  operations: Record<string, string>;
  amountLabel: string;
  text: { invalid: string; noBand: string; resultFor: string; more: string };
}
