import type { BuilderPayload } from './builder-types';
import type { BrandView } from './brand-types';
import { SHOW_BRAND_LOGOS } from '../config';
import type { Catalog, CatalogEntry } from './catalog-types';
import type { Brand, Operator } from './schema';

/** Serialized for a <script type="application/json">; "<" is escaped so data can never close the tag. */
export function builderPayload(catalog: Catalog, home: string): string {
  const entries = [...catalog.byCountry.values()].flatMap((c) =>
    c.entries
      .filter((e) => e.ussd.params.length > 0 && e.provenance.status !== 'discontinued')
      .map((e) => [e.id, { id: e.id, country: e.country, operator: e.operator, title: e.name, brand: brandFor(e, c.operators), ussd: e.ussd }] as const),
  );

  const payload: BuilderPayload = {
    home,
    countries: catalog.countries.map((c) => ({ code: c.code, name: c.name, dialCode: c.dial_code, nationalLength: c.national_length })),
    entries: Object.fromEntries(entries),
  };

  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

function brandFor(entry: CatalogEntry, operators: Operator[]): BrandView | null {
  const operator = operators.find((o) => o.id === entry.operator);
  const brand: Brand | undefined = entry.category === 'mobile-money' ? (operator?.mobile_money ?? operator) : operator;

  return brand ? { name: brand.short_name, badge: brand.badge, logo: SHOW_BRAND_LOGOS && brand.logo ? `/brands/${brand.logo}` : null } : null;
}
