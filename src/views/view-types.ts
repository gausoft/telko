import type { Catalog, CountryCatalog } from '../lib/catalog-types';
import type { Country, Operator } from '../lib/schema';
import type { Section } from '../lib/sections';

/** Every catalog below is already in the page language. */
export interface CountryHomeProps {
  data: CountryCatalog;
  catalog: Catalog;
}

export interface SearchProps {
  data: CountryCatalog;
  catalog: Catalog;
  /** Search documents and brands, serialized for the page script. */
  payload: string;
}

export interface SettingsProps {
  data: CountryCatalog;
  countries: Country[];
}

export interface SectionProps {
  data: CountryCatalog;
  operator: Operator;
  section: Section;
  catalog: Catalog;
}
