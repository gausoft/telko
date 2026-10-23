import type { Catalog, CountryCatalog } from '../lib/catalog-types';
import type { Country, Operator } from '../lib/schema';
import type { Section } from '../lib/sections';

/** A live country, with its data. */
export interface CountryHomeProps {
  view: 'home';
  data: CountryCatalog;
  catalog: Catalog;
}

/** A country listed as `soon` (or before the switch to live, once its data is ready): no section page is built yet. */
export interface CountrySoonProps {
  view: 'soon';
  country: Country;
  /** Operators already listed for this country, from its data folder; empty while it has none. */
  operators: Operator[];
}

export type CountryPageProps = CountryHomeProps | CountrySoonProps;

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
