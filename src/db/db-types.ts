import type { Lang } from '../i18n/i18n-types';
import type { CatalogEntry } from '../lib/catalog-types';

/** Catalog rows mirror the build-time catalog; they are replaced as a whole when the data version changes. */
export type EntryRow = CatalogEntry;

export interface MetaRow {
  key: string;
  value: string;
}

/** How often a code is used on this device. Only the code id is kept, never what was typed in it. */
export interface UsageRow {
  entryId: string;
  country: string;
  operator: string;
  count: number;
  lastUsedAt: number;
  updatedAt: number;
}

export interface UseEvent {
  entryId: string;
  country: string;
  operator: string;
}

export interface RecipientRow {
  /** "<country>:<number>" */
  key: string;
  country: string;
  number: string;
  usedAt: number;
  updatedAt: number;
}

/** The offline file served at /offline/<country>.json (French) and /offline/en/<country>.json. */
export interface OfflinePack {
  version: string;
  country: string;
  lang: Lang;
  operators: string[];
  /** Pages for each operator, plus the files shared by all operators (country pages, brand images). */
  pages: { shared: string[]; byOperator: Record<string, string[]> };
  entries: CatalogEntry[];
}
