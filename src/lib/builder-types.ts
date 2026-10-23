import type { BrandView } from './brand-types';
import type { Ussd } from './schema';

export interface BuilderEntry {
  id: string;
  country: string;
  operator: string;
  title: string;
  brand: BrandView | null;
  ussd: Ussd;
}

export interface BuilderCountry {
  code: string;
  name: string;
  dialCode: string;
  nationalLength: number;
  /** "F", "GH₵": how an amount is written after the figure. */
  amountLabel: string;
  /** Quick amounts of the amount keyboard, from the country file. */
  amountPresets: number[];
}

/** Data embedded in a page for the code assistant: only the codes that need input. */
export interface BuilderPayload {
  home: string;
  countries: BuilderCountry[];
  entries: Record<string, BuilderEntry>;
}
