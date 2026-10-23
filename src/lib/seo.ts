import { DEFAULT_COUNTRY, SHOW_BRAND_LOGOS } from '../config';
import { LANGS, SOURCE_LANG, type Lang } from '../i18n/i18n-types';
import { localePath } from '../i18n/paths';
import { featuredFor, sectionEntries } from './catalog';
import type { Catalog, CatalogEntry, CountryCatalog } from './catalog-types';
import { formatAmount, formatData } from './format';
import { fingerprint } from './hash';
import { localizeCatalog } from './localize';
import type { Brand, Country, Operator } from './schema';
import { seoCopyEn } from './seo-copy-en';
import { seoCopyFr } from './seo-copy-fr';
import type { SeoCopy } from './seo-copy-types';
import { SECTIONS, type Section } from './sections';
import type { Alternate, PageSeo, SectionFacts, ShareCard } from './seo-types';

const COPY: Record<Lang, SeoCopy> = { fr: seoCopyFr, en: seoCopyEn };

/** The splash screen has no content of its own: search engines are sent to the default country. */
export function splashSeo(): PageSeo {
  const copy = COPY[SOURCE_LANG];

  return {
    lang: SOURCE_LANG,
    title: `Telko · ${copy.signature.slice(0, -1)}`,
    description: copy.splashDescription,
    path: `/${DEFAULT_COUNTRY}`,
    image: imagePath(defaultCard(SOURCE_LANG)),
    imageAlt: copy.imageAlt(copy.signature),
    noindex: false,
    crumbs: [],
    alternates: [],
  };
}

/** App screens with no content worth a search result (onboarding, settings, search). `path` has no language prefix. */
export function appPageSeo(title: string, path: string, lang: Lang): PageSeo {
  const copy = COPY[lang];

  return {
    lang,
    title,
    description: copy.signature,
    path: localePath(lang, path),
    image: imagePath(defaultCard(lang)),
    imageAlt: copy.imageAlt(copy.signature),
    noindex: true,
    crumbs: [],
    alternates: [],
  };
}

/** `data` is the country catalog already in `lang`. */
export function countryHomeSeo(data: CountryCatalog, lang: Lang): PageSeo {
  const copy = COPY[lang];
  const country = data.country.name;
  const operators = data.operators.map((o) => o.short_name);
  const money = data.operators.flatMap((o) => (o.mobile_money ? [o.mobile_money.short_name] : []));
  const path = `/${data.country.code}`;

  return {
    lang,
    title: copy.homeTitle(country),
    description: copy.homeDescription(operators, money),
    path: localePath(lang, path),
    image: imagePath(countryCard(data, lang)),
    imageAlt: copy.homeAlt(country, operators),
    noindex: false,
    crumbs: [],
    alternates: alternates(path),
  };
}

/**
 * A country still listed as `soon`. Its page answers "when does Telko arrive here", so it stays
 * out of the index: thin pages repeated for every country would be doorway pages. It becomes
 * indexable the day the country goes live.
 */
export function countrySoonSeo(country: Country, operators: Operator[], lang: Lang): PageSeo {
  const copy = COPY[lang];
  const path = `/${country.code}`;

  return {
    lang,
    title: copy.soonTitle(country.name),
    description: copy.soonDescription(country.name, operators.map((o) => o.short_name)),
    path: localePath(lang, path),
    image: imagePath(defaultCard(lang)),
    imageAlt: copy.imageAlt(copy.signature),
    noindex: true,
    crumbs: [],
    alternates: [],
  };
}

export function sectionSeo(data: CountryCatalog, operator: Operator, section: Section, lang: Lang): PageSeo {
  const facts = sectionFacts(data, operator, section, lang);
  const code = data.country.code;
  const path = `/${code}/${operator.id}/${section.id}`;

  return {
    lang,
    title: `${facts.heading} · ${data.country.name} · Telko`,
    description: facts.description,
    path: localePath(lang, path),
    image: imagePath(sectionCard(data, operator, section, lang)),
    imageAlt: facts.highlight ? `${facts.heading}${lang === 'fr' ? ' : ' : ': '}${facts.highlight}` : facts.heading,
    noindex: false,
    crumbs: [
      { name: `Telko ${data.country.name}`, path: localePath(lang, `/${code}`) },
      { name: facts.heading, path: localePath(lang, path) },
    ],
    alternates: alternates(path),
  };
}

/** Every share image the build renders, in every language: one default, one per country home, one per section page. */
export function shareCards(catalog: Catalog): ShareCard[] {
  return LANGS.flatMap((lang) => {
    const localized = localizeCatalog(catalog, lang);
    const cards: ShareCard[] = [defaultCard(lang)];

    for (const data of localized.byCountry.values()) {
      cards.push(countryCard(data, lang));
      for (const operator of data.operators) for (const section of SECTIONS) cards.push(sectionCard(data, operator, section, lang));
    }

    return cards;
  });
}

/** French, English and the default (French, the source) version of an indexed page. */
function alternates(path: string): Alternate[] {
  return [...LANGS.map((l) => ({ hreflang: l, path: localePath(l, path) })), { hreflang: 'x-default', path }];
}

/** French slugs keep their names so existing link previews still work; other languages get a prefix. */
function slug(lang: Lang, base: string): string {
  return lang === SOURCE_LANG ? base : `${lang}-${base}`;
}

function defaultCard(lang: Lang): ShareCard {
  const copy = COPY[lang];

  return { slug: slug(lang, 'telko'), eyebrow: copy.defaultEyebrow, title: copy.signature, highlight: null, logos: [] };
}

function countryCard(data: CountryCatalog, lang: Lang): ShareCard {
  const brands = data.operators.flatMap((o) => [o, ...(o.mobile_money ? [o.mobile_money] : [])]);

  return {
    slug: slug(lang, data.country.code),
    eyebrow: data.country.name,
    title: COPY[lang].homeCardTitle,
    highlight: COPY[lang].homeCardHighlight,
    logos: logoFiles(brands),
  };
}

function sectionCard(data: CountryCatalog, operator: Operator, section: Section, lang: Lang): ShareCard {
  const facts = sectionFacts(data, operator, section, lang);

  return {
    slug: slug(lang, `${data.country.code}-${operator.id}-${section.id}`),
    eyebrow: `${data.country.name} · ${facts.brand.name}`,
    title: facts.heading,
    highlight: facts.highlight,
    logos: logoFiles([facts.brand]),
  };
}

/** Heading, description and selling line of a section page, written from its real offers. */
function sectionFacts(data: CountryCatalog, operator: Operator, section: Section, lang: Lang): SectionFacts {
  const copy = COPY[lang];
  const entries = sectionEntries(data, operator.id, section);
  const prices = entries.flatMap((e) => (e.price !== null && e.price > 0 ? [e.price] : []));
  const from = prices.length > 0 ? formatAmount(Math.min(...prices), data.country.amount_label) : null;
  const money = operator.mobile_money ?? operator;
  const fees = data.fees.filter((f) => f.operator === operator.id).length;
  const ctx = {
    count: entries.length,
    operatorName: operator.name,
    operatorShort: operator.short_name,
    moneyShort: money.short_name,
    moneyName: copy.moneyName(money.name, money.former_names[0]),
    from,
    fees,
  };
  const codes = entries.length > 0 ? copy.codes(entries.length) : null;
  const fromLine = from ? copy.from(from) : null;
  const highlights: Record<Section['id'], string | null> = {
    internet: popularOffer(data, operator, entries, lang) ?? fromLine,
    appels: fromLine ?? codes,
    argent: codes,
    factures: codes,
    frais: fees > 0 ? copy.amounts(fees) : null,
    aide: codes,
  };
  const brand: Brand = section.id === 'argent' || section.id === 'frais' ? money : operator;

  return { heading: copy.heading(section.id, ctx), description: copy.description(section.id, ctx), highlight: highlights[section.id], brand };
}

/** The operator's most asked offer of this section, from the editorial selection, as "5 Go · 599 F". */
function popularOffer(data: CountryCatalog, operator: Operator, entries: CatalogEntry[], lang: Lang): string | null {
  const listed = new Set(entries.map((e) => e.id));
  const entry = featuredFor(data, operator.id).find((f) => listed.has(f.entry.id))?.entry;
  const volume = formatData(entry?.allowances?.data_mb ?? null, lang);
  if (!entry || entry.price === null || !volume) return null;

  return `${volume} · ${formatAmount(entry.price, entry.amountLabel)}`;
}

/** Logos follow the same switch as the app, pending legal review. */
function logoFiles(brands: Brand[]): string[] {
  return SHOW_BRAND_LOGOS ? brands.flatMap((b) => (b.logo ? [b.logo] : [])) : [];
}

/** The version changes with the content, so link previews fetch the image again when a price changes. */
function imagePath(card: ShareCard): string {
  return `/og/${card.slug}.png?v=${fingerprint(JSON.stringify(card))}`;
}
