import { SHOW_BRAND_LOGOS } from '../config';
import type { Lang } from '../i18n/i18n-types';
import type { CountryHomeProps, SearchProps, SectionProps, SettingsProps } from '../views/view-types';
import { loadCatalog } from './catalog';
import type { Catalog } from './catalog-types';
import type { Badge } from './schema';
import { localizeCatalog } from './localize';
import { buildDocs } from './search';
import { SECTIONS } from './sections';

/**
 * Static paths of the country pages for one language. French and English pages share these
 * builders, so both languages always list the same pages with the same data.
 */
export function countryHomePaths(lang: Lang): { params: { country: string }; props: CountryHomeProps }[] {
  const catalog = localizeCatalog(loadCatalog(), lang);

  return [...catalog.byCountry.values()].map((data) => ({ params: { country: data.country.code }, props: { data, catalog } }));
}

export function searchPaths(lang: Lang): { params: { country: string }; props: SearchProps }[] {
  const source = loadCatalog();
  const catalog = localizeCatalog(source, lang);
  // "<" is escaped so contributed data can never close the script tag it is embedded in.
  const payload = JSON.stringify({ docs: buildDocs(source, lang), brands: searchBrands(catalog), soon: soonCountries(catalog) }).replace(/</g, '\\u003c');

  return [...catalog.byCountry.values()].map((data) => ({ params: { country: data.country.code }, props: { data, catalog, payload } }));
}

export function settingsPaths(lang: Lang): { params: { country: string }; props: SettingsProps }[] {
  const catalog = localizeCatalog(loadCatalog(), lang);

  return [...catalog.byCountry.values()].map((data) => ({ params: { country: data.country.code }, props: { data, countries: catalog.countries } }));
}

export function sectionPaths(lang: Lang): { params: { country: string; operator: string; section: string }; props: SectionProps }[] {
  const catalog = localizeCatalog(loadCatalog(), lang);

  return [...catalog.byCountry.values()].flatMap((data) =>
    data.operators.flatMap((operator) =>
      SECTIONS.map((section) => ({
        params: { country: data.country.code, operator: operator.id, section: section.id },
        props: { data, operator, section, catalog },
      })),
    ),
  );
}

function searchBrands(catalog: Catalog): Record<string, { name: string; badge: Badge; logo: string | null }> {
  return Object.fromEntries(
    [...catalog.byCountry.values()].flatMap((c) =>
      c.operators.map((o) => [`${c.country.code}:${o.id}`, { name: o.short_name, badge: o.badge, logo: SHOW_BRAND_LOGOS ? o.logo : null }]),
    ),
  );
}

function soonCountries(catalog: Catalog): string[] {
  return catalog.countries.filter((c) => c.status === 'soon').map((c) => c.code);
}
