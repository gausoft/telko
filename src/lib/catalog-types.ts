import type { Brand, Category, Country, Entry, FeeEntry, Operator } from './schema';
import type { DurationFilter } from './sections';

export interface CatalogEntry extends Entry {
  country: string;
  operator: string;
  category: Category;
  /** Period filter of the Data page, read from the French validity label so translations never move an offer. */
  duration: DurationFilter;
}

/** English text of an editorial label; French shows when it is missing. */
export interface LabelTranslation {
  en?: { label?: string | undefined } | undefined;
}

export interface CatalogFee extends FeeEntry {
  country: string;
  operator: string;
  service: string;
}

export interface FeaturedItem extends LabelTranslation {
  label: string;
  entry: CatalogEntry;
}

export interface ShortcutItem extends LabelTranslation {
  label: string;
  brand: Brand;
  entry: CatalogEntry;
}

export interface EditorialSelection {
  featured: FeaturedItem[];
  shortcuts: ShortcutItem[];
}

export interface CountryCatalog {
  country: Country;
  operators: Operator[];
  entries: CatalogEntry[];
  fees: CatalogFee[];
  featured: FeaturedItem[];
  shortcuts: ShortcutItem[];
}

export interface Catalog {
  countries: Country[];
  byCountry: Map<string, CountryCatalog>;
}
