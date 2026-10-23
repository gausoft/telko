import type { Lang } from '../i18n/i18n-types';
import type { Catalog, CatalogEntry, CatalogFee, CountryCatalog, FeaturedItem, ShortcutItem } from './catalog-types';
import type { Country, Operator, Param, Ussd } from './schema';

const CACHE = new WeakMap<Catalog, Map<Lang, Catalog>>();

/**
 * The catalog as a page in `lang` shows it: each text takes its English version when there is one,
 * French otherwise, and the `en` blocks are removed so pages and payloads carry one language.
 */
export function localizeCatalog(catalog: Catalog, lang: Lang): Catalog {
  const byLang = CACHE.get(catalog) ?? new Map<Lang, Catalog>();
  CACHE.set(catalog, byLang);

  const cached = byLang.get(lang);
  if (cached) return cached;

  const localized: Catalog = {
    countries: catalog.countries.map((c) => localizeCountry(c, lang)),
    byCountry: new Map([...catalog.byCountry].map(([code, data]) => [code, localizeCountryCatalog(data, lang)])),
    pending: new Map([...catalog.pending].map(([code, data]) => [code, localizeCountryCatalog(data, lang)])),
  };
  byLang.set(lang, localized);

  return localized;
}

function localizeCountryCatalog(data: CountryCatalog, lang: Lang): CountryCatalog {
  const entries = new Map(data.entries.map((e) => [e.id, localizeEntry(e, lang)]));
  const entryOf = (entry: CatalogEntry): CatalogEntry => entries.get(entry.id) ?? localizeEntry(entry, lang);

  return {
    country: localizeCountry(data.country, lang),
    operators: data.operators.map((o) => localizeOperator(o, lang)),
    entries: [...entries.values()],
    fees: data.fees.map((f) => localizeFee(f, lang)),
    featured: data.featured.map((f): FeaturedItem => ({ label: labelOf(f, lang), entry: entryOf(f.entry) })),
    shortcuts: data.shortcuts.map((s): ShortcutItem => ({ label: labelOf(s, lang), brand: s.brand, entry: entryOf(s.entry) })),
  };
}

export function localizeEntry(entry: CatalogEntry, lang: Lang): CatalogEntry {
  const { en, ...rest } = entry;
  const english = lang === 'en' ? en : undefined;

  return {
    ...rest,
    name: english?.name ?? entry.name,
    description: english?.description ?? entry.description,
    notes: entry.notes === null ? null : (english?.notes ?? entry.notes),
    validity: entry.validity ? localizeValidity(entry.validity, lang) : null,
    ussd: localizeUssd(entry.ussd, lang),
    third_party: entry.third_party ? localizeUssd(entry.third_party, lang) : null,
  };
}

function localizeValidity(validity: NonNullable<CatalogEntry['validity']>, lang: Lang): NonNullable<CatalogEntry['validity']> {
  const { en, ...rest } = validity;

  return { ...rest, label: (lang === 'en' ? en?.label : undefined) ?? validity.label };
}

function localizeUssd(ussd: Ussd, lang: Lang): Ussd {
  return { ...ussd, params: ussd.params.map((p) => localizeParam(p, lang)) };
}

function localizeParam(param: Param, lang: Lang): Param {
  const { en, options, ...rest } = param;
  const english = lang === 'en' ? en : undefined;
  const short = english?.short ?? param.short;
  const localized: Param = { ...rest, label: english?.label ?? param.label };
  if (short !== undefined) localized.short = short;
  if (options) localized.options = options.map(({ en: optionEn, ...o }) => ({ ...o, label: (lang === 'en' ? optionEn?.label : undefined) ?? o.label }));

  return localized;
}

function localizeFee(fee: CatalogFee, lang: Lang): CatalogFee {
  const { en, ...rest } = fee;
  const english = lang === 'en' ? en : undefined;

  return { ...rest, label: english?.label ?? fee.label, notes: fee.notes === null ? null : (english?.notes ?? fee.notes) };
}

function localizeOperator(operator: Operator, lang: Lang): Operator {
  const { en, ...rest } = operator;

  return { ...rest, notes: operator.notes === null ? null : ((lang === 'en' ? en?.notes : undefined) ?? operator.notes) };
}

function localizeCountry(country: Country, lang: Lang): Country {
  const { en, ...rest } = country;

  return { ...rest, name: (lang === 'en' ? en?.name : undefined) ?? country.name };
}

function labelOf(item: FeaturedItem | ShortcutItem, lang: Lang): string {
  return (lang === 'en' ? item.en?.label : undefined) ?? item.label;
}
