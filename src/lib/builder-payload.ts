import type { BuilderPayload } from './builder-types';
import type { Catalog } from './catalog-types';

/** Serialized for a <script type="application/json">; "<" is escaped so data can never close the tag. */
export function builderPayload(catalog: Catalog, home: string): string {
  const entries = [...catalog.byCountry.values()]
    .flatMap((c) => c.entries)
    .filter((e) => e.ussd.params.length > 0 && e.provenance.status !== 'discontinued')
    .map((e) => [e.id, { id: e.id, title: e.name, ussd: e.ussd }] as const);

  const payload: BuilderPayload = {
    home,
    countries: catalog.countries.map((c) => ({ code: c.code, name: c.name, dialCode: c.dial_code, nationalLength: c.national_length })),
    entries: Object.fromEntries(entries),
  };

  return JSON.stringify(payload).replace(/</g, '\\u003c');
}
