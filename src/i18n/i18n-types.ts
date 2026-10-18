import type { fr } from './fr';

export const LANGS = ['fr', 'en'] as const;

export type Lang = (typeof LANGS)[number];

/** French is the source language: it keeps the current URLs, other languages get a prefix. */
export const SOURCE_LANG: Lang = 'fr';

/** Turns every literal string of the French dictionary into `string`, so other languages share its shape. */
type Widen<T> = T extends string ? string : T extends readonly (infer U)[] ? readonly Widen<U>[] : { readonly [K in keyof T]: Widen<T[K]> };

export type Messages = Widen<typeof fr>;

/** The part of the dictionary that browser scripts need; embedded in each page as JSON. */
export type ClientMessages = Messages['client'];

export interface Plural {
  one: string;
  other: string;
}
