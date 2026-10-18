import type { Ussd } from './schema';

export interface BuilderEntry {
  id: string;
  country: string;
  operator: string;
  title: string;
  ussd: Ussd;
}

export interface BuilderCountry {
  code: string;
  name: string;
  dialCode: string;
  nationalLength: number;
}

/** Data embedded in a page for the code assistant: only the codes that need input. */
export interface BuilderPayload {
  home: string;
  countries: BuilderCountry[];
  entries: Record<string, BuilderEntry>;
}
