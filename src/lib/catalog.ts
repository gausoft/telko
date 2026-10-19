import type { ZodType } from 'zod';

import type {
  Catalog,
  CatalogEntry,
  CatalogFee,
  CountryCatalog,
  EditorialSelection,
  FeaturedItem,
  ShortcutItem,
} from './catalog-types';
import { effectiveStatus, assertVerificationProof } from './freshness';
import {
  categoryFileSchema,
  countriesFileSchema,
  featuredFileSchema,
  feesFileSchema,
  operatorsFileSchema,
  type Country,
  type FeaturedFile,
  type Operator,
} from './schema';
import { durationOf, type Section } from './sections';

const RAW_FILES = import.meta.glob<unknown>('/data/**/*.json', { eager: true, import: 'default' });

/** Payment by airtime; every other method must be a mobile money service of the country. */
const AIRTIME = 'airtime';

/** One data file being read, with the country and operator it belongs to. */
interface FileContext {
  path: string;
  raw: unknown;
  operator: string;
  fileName: string;
  country: Country;
  /** Ids of the mobile money services of the country, from its operators. */
  services: string[];
  now: Date;
}

export function loadCatalog(files: Record<string, unknown> = RAW_FILES, now: Date = new Date()): Catalog {
  const countries = parse(files, '/data/countries.json', countriesFileSchema).countries;
  const byCountry = new Map<string, CountryCatalog>();
  const pending = new Map<string, CountryCatalog>();

  for (const country of countries) {
    // A country still listed as `soon` is read as soon as it has a folder, so its data is checked
    // before maintainers flip it to `live`; its pages wait.
    if (country.status === 'soon' && !hasFolder(files, country.code)) continue;

    const data = loadCountry(files, country, now);
    (country.status === 'live' ? byCountry : pending).set(country.code, data);
  }

  return { countries, byCountry, pending };
}

function hasFolder(files: Record<string, unknown>, code: string): boolean {
  return `/data/${code}/operators.json` in files;
}

function loadCountry(files: Record<string, unknown>, country: Country, now: Date): CountryCatalog {
  const root = `/data/${country.code}/`;
  const operators = parse(files, `${root}operators.json`, operatorsFileSchema).operators;
  const operatorIds = new Set(operators.map((o) => o.id));
  const services = operators.flatMap((o) => (o.mobile_money ? [o.mobile_money.id] : []));
  const entries: CatalogEntry[] = [];
  const fees: CatalogFee[] = [];

  for (const [path, raw] of Object.entries(files)) {
    if (!isOperatorFile(path, root)) continue;
    const [folder = '', fileName = ''] = path.slice(root.length).split('/');
    if (!operatorIds.has(folder)) throw new Error(`${path}: folder "${folder}" is not an operator of ${country.code}`);

    const context: FileContext = { path, raw, operator: folder, fileName, country, services, now };
    if (fileName === 'fees.json') {
      fees.push(...loadFees(context));
      continue;
    }

    entries.push(...loadEntries(context));
  }

  const editorial = loadEditorial(files, root, entries, operators);

  return { country, operators, entries, fees, ...editorial };
}

function isOperatorFile(path: string, root: string): boolean {
  return path.startsWith(root) && path.slice(root.length).split('/').length === 2;
}

function loadFees(ctx: FileContext): CatalogFee[] {
  const file = parse({ [ctx.path]: ctx.raw }, ctx.path, feesFileSchema);
  if (file.operator !== ctx.operator) throw new Error(`${ctx.path}: operator "${file.operator}" must match its folder "${ctx.operator}"`);

  return file.entries.map((e) => ({ ...e, country: ctx.country.code, operator: ctx.operator, service: file.service, amountLabel: ctx.country.amount_label }));
}

function loadEntries(ctx: FileContext): CatalogEntry[] {
  const file = parse({ [ctx.path]: ctx.raw }, ctx.path, categoryFileSchema);
  if (file.operator !== ctx.operator) throw new Error(`${ctx.path}: operator "${file.operator}" must match its folder "${ctx.operator}"`);
  if (`${file.category}.json` !== ctx.fileName) throw new Error(`${ctx.path}: category "${file.category}" must match the file name`);

  return file.entries.map((e) => {
    assertVerificationProof(ctx.path, e, file.category);
    assertPaymentMethods(ctx, e.id, e.payment_methods);

    return {
      ...e,
      provenance: { ...e.provenance, status: effectiveStatus(e.provenance, file.category, ctx.now) },
      duration: durationOf(e.validity?.days ?? null, e.validity?.label ?? '', e.time_window !== null),
      country: ctx.country.code,
      operator: ctx.operator,
      category: file.category,
      amountLabel: ctx.country.amount_label,
    };
  });
}

function assertPaymentMethods(ctx: FileContext, id: string, methods: string[]): void {
  const unknown = methods.find((method) => method !== AIRTIME && !ctx.services.includes(method));
  if (unknown) throw new Error(`${ctx.path}: "${id}" is paid with "${unknown}", not a mobile money service of ${ctx.country.code}`);
}

function loadEditorial(files: Record<string, unknown>, root: string, entries: CatalogEntry[], operators: Operator[]): EditorialSelection {
  const path = `${root}featured.json`;
  if (!(path in files)) return { featured: [], shortcuts: [] };

  const file = parse(files, path, featuredFileSchema);
  const find = entryFinder(path, entries);

  return {
    featured: file.items.map((item) => ({ label: item.label, en: item.en, entry: find(item.entry_id) })),
    shortcuts: file.shortcuts.map((item) => toShortcut(path, item, find(item.entry_id), operators)),
  };
}

function entryFinder(path: string, entries: CatalogEntry[]): (id: string) => CatalogEntry {
  const byId = new Map(entries.map((e) => [e.id, e]));

  return (id) => {
    const entry = byId.get(id);
    if (!entry) throw new Error(`${path}: unknown entry_id "${id}"`);
    if (entry.provenance.status === 'discontinued') throw new Error(`${path}: "${id}" is discontinued and cannot be promoted`);

    return entry;
  };
}

function toShortcut(path: string, item: FeaturedFile['shortcuts'][number], entry: CatalogEntry, operators: Operator[]): ShortcutItem {
  const operator = operators.find((o) => o.id === entry.operator);
  const brand = item.brand === 'mobile_money' ? operator?.mobile_money : operator;
  if (!brand) throw new Error(`${path}: no ${item.brand} brand for "${item.entry_id}"`);

  return { label: item.label, en: item.en, brand, entry };
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
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
}

/** Offers listed on a section page: same operator, matching categories, still sold. */
export function sectionEntries(catalog: CountryCatalog, operator: string, section: Section): CatalogEntry[] {
  return catalog.entries.filter(
    (e) => e.operator === operator && section.categories.includes(e.category) && e.provenance.status !== 'discontinued',
  );
}

export function featuredFor(catalog: CountryCatalog, operator: string): FeaturedItem[] {
  return catalog.featured.filter((f) => f.entry.operator === operator);
}

export function shortcutsFor(catalog: CountryCatalog, operator: string): ShortcutItem[] {
  return catalog.shortcuts.filter((s) => s.entry.operator === operator);
}
