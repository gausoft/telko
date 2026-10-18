import type { ZodType } from 'zod';

import type { Catalog, CatalogEntry, CatalogFee, CountryCatalog, FeaturedItem } from './catalog-types';
import {
  categoryFileSchema,
  countriesFileSchema,
  featuredFileSchema,
  feesFileSchema,
  operatorsFileSchema,
  type Country,
  type Operator,
} from './schema';

const RAW_FILES = import.meta.glob<unknown>('/data/**/*.json', { eager: true, import: 'default' });

export function loadCatalog(files: Record<string, unknown> = RAW_FILES): Catalog {
  const countries = parse(files, '/data/countries.json', countriesFileSchema).countries;
  const byCountry = new Map<string, CountryCatalog>();

  for (const country of countries.filter((c) => c.status === 'live')) {
    byCountry.set(country.code, loadCountry(files, country));
  }

  return { countries, byCountry };
}

function loadCountry(files: Record<string, unknown>, country: Country): CountryCatalog {
  const root = `/data/${country.code}/`;
  const operators = parse(files, `${root}operators.json`, operatorsFileSchema).operators;
  const entries: CatalogEntry[] = [];
  const fees: CatalogFee[] = [];

  for (const [path, raw] of Object.entries(files)) {
    if (!isOperatorFile(path, root)) continue;

    if (path.endsWith('/fees.json')) {
      const file = parse({ [path]: raw }, path, feesFileSchema);
      fees.push(...file.entries.map((e) => ({ ...e, country: country.code, operator: file.operator, service: file.service })));
      continue;
    }

    const file = parse({ [path]: raw }, path, categoryFileSchema);
    entries.push(...file.entries.map((e) => ({ ...e, country: country.code, operator: file.operator, category: file.category })));
  }

  const featured = loadFeatured(files, root, entries);

  return { country, operators, entries, fees, featured };
}

function isOperatorFile(path: string, root: string): boolean {
  const rest = path.slice(root.length);

  return path.startsWith(root) && rest.split('/').length === 2;
}

function loadFeatured(files: Record<string, unknown>, root: string, entries: CatalogEntry[]): FeaturedItem[] {
  const path = `${root}featured.json`;
  if (!(path in files)) return [];

  const file = parse(files, path, featuredFileSchema);
  const byId = new Map(entries.map((e) => [e.id, e]));

  return file.items.map((item) => {
    const entry = byId.get(item.entry_id);
    if (!entry) throw new Error(`${path}: unknown entry_id "${item.entry_id}"`);

    return { label: item.label, entry };
  });
}

function parse<T>(files: Record<string, unknown>, path: string, schema: ZodType<T>): T {
  if (!(path in files)) throw new Error(`Missing data file ${path}`);

  const result = schema.safeParse(files[path]);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(`${path}: ${issue?.path.join('.') ?? ''} ${issue?.message ?? 'invalid'}`);
  }

  return result.data;
}

export function operatorById(catalog: CountryCatalog, id: string): Operator | undefined {
  return catalog.operators.find((o) => o.id === id);
}

export function entriesFor(catalog: CountryCatalog, operator: string, category: string): CatalogEntry[] {
  return catalog.entries
    .filter((e) => e.operator === operator && e.category === category && e.provenance.status !== 'discontinued')
    .sort((a, b) => (a.price_xof ?? 0) - (b.price_xof ?? 0));
}

export function featuredFor(catalog: CountryCatalog, operator: string): FeaturedItem[] {
  return catalog.featured.filter((f) => f.entry.operator === operator);
}
