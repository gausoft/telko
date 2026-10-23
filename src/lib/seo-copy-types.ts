import type { SectionId } from './sections';

/** What a section page says about itself, from its real offers. */
export interface SectionCopyContext {
  /** Offers listed on the page. */
  count: number;
  operatorName: string;
  operatorShort: string;
  moneyShort: string;
  /** Mobile money name with its former name, e.g. "Moov Money (ex-Flooz)". */
  moneyName: string;
  /** Cheapest price, already formatted, or null. */
  from: string | null;
  /** Fee lines of the operator. */
  fees: number;
}

/** Wording of titles, descriptions and share images in one language; grammar differs too much for templates. */
export interface SeoCopy {
  signature: string;
  defaultEyebrow: string;
  splashDescription: string;
  imageAlt(text: string): string;
  homeTitle(country: string): string;
  homeDescription(operators: string[], money: string[]): string;
  homeAlt(country: string, operators: string[]): string;
  homeCardTitle: string;
  homeCardHighlight: string;
  /** Page of a country listed as `soon`. */
  soonTitle(country: string): string;
  soonDescription(country: string, operators: string[]): string;
  heading(id: SectionId, ctx: SectionCopyContext): string;
  description(id: SectionId, ctx: SectionCopyContext): string;
  moneyName(name: string, former: string | undefined): string;
  from(price: string): string;
  codes(n: number): string;
  amounts(n: number): string;
}
