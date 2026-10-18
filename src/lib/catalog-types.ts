import type { Brand, Category, Country, Entry, FeeEntry, Operator } from './schema';

export interface CatalogEntry extends Entry {
  country: string;
  operator: string;
  category: Category;
}

export interface CatalogFee extends FeeEntry {
  country: string;
  operator: string;
  service: string;
}

export interface FeaturedItem {
  label: string;
  entry: CatalogEntry;
}

export interface ShortcutItem {
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
