import { DEFAULT_COUNTRY, SHOW_BRAND_LOGOS } from '../config';
import { featuredFor, sectionEntries } from './catalog';
import type { Catalog, CatalogEntry, CountryCatalog } from './catalog-types';
import { formatData, formatXof } from './format';
import { fingerprint } from './hash';
import type { Brand, Operator } from './schema';
import { SECTIONS, type Section } from './sections';
import type { PageSeo, SectionFacts, ShareCard } from './seo-types';

const SIGNATURE = 'Tous vos services mobiles, au même endroit.';
const DEFAULT_CARD: ShareCard = { slug: 'telko', eyebrow: 'Codes USSD · forfaits · mobile money', title: SIGNATURE, highlight: null, logos: [] };

/** The splash screen has no content of its own: search engines are sent to the default country. */
export function splashSeo(): PageSeo {
  return {
    title: `Telko · ${SIGNATURE.slice(0, -1)}`,
    description: `${SIGNATURE} Codes USSD, forfaits et mobile money, même hors connexion.`,
    path: `/${DEFAULT_COUNTRY}`,
    image: imagePath(DEFAULT_CARD),
    imageAlt: `Telko : ${SIGNATURE}`,
    noindex: false,
    crumbs: [],
  };
}

/** App screens with no content worth a search result (onboarding, settings, search). */
export function appPageSeo(title: string, path: string): PageSeo {
  return {
    title,
    description: SIGNATURE,
    path,
    image: imagePath(DEFAULT_CARD),
    imageAlt: `Telko : ${SIGNATURE}`,
    noindex: true,
    crumbs: [],
  };
}

export function countryHomeSeo(data: CountryCatalog): PageSeo {
  const country = data.country.name;
  const operators = joinFr(data.operators.map((o) => o.short_name));
  const money = data.operators.flatMap((o) => (o.mobile_money ? [o.mobile_money.short_name] : []));

  return {
    title: `Codes USSD, forfaits et mobile money · ${country} · Telko`,
    description: `Forfaits internet, appels, ${joinFr(['factures', ...money])} : tous les codes ${operators} en un tap, même hors connexion.`,
    path: `/${data.country.code}`,
    image: imagePath(countryCard(data)),
    imageAlt: `Telko ${country} : codes ${operators}`,
    noindex: false,
    crumbs: [],
  };
}

export function sectionSeo(data: CountryCatalog, operator: Operator, section: Section): PageSeo {
  const facts = sectionFacts(data, operator, section);
  const code = data.country.code;
  const path = `/${code}/${operator.id}/${section.id}`;

  return {
    title: `${facts.heading} · ${data.country.name} · Telko`,
    description: facts.description,
    path,
    image: imagePath(sectionCard(data, operator, section)),
    imageAlt: facts.highlight ? `${facts.heading} : ${facts.highlight}` : facts.heading,
    noindex: false,
    crumbs: [
      { name: `Telko ${data.country.name}`, path: `/${code}` },
      { name: facts.heading, path },
    ],
  };
}

/** Every share image the build renders: one default, one per country home, one per section page. */
export function shareCards(catalog: Catalog): ShareCard[] {
  const cards: ShareCard[] = [DEFAULT_CARD];

  for (const data of catalog.byCountry.values()) {
    cards.push(countryCard(data));
    for (const operator of data.operators) for (const section of SECTIONS) cards.push(sectionCard(data, operator, section));
  }

  return cards;
}

function countryCard(data: CountryCatalog): ShareCard {
  const brands = data.operators.flatMap((o) => [o, ...(o.mobile_money ? [o.mobile_money] : [])]);

  return {
    slug: data.country.code,
    eyebrow: data.country.name,
    title: 'Codes USSD, forfaits et mobile money',
    highlight: 'Même hors connexion',
    logos: logoFiles(brands),
  };
}

function sectionCard(data: CountryCatalog, operator: Operator, section: Section): ShareCard {
  const facts = sectionFacts(data, operator, section);

  return {
    slug: `${data.country.code}-${operator.id}-${section.id}`,
    eyebrow: `${data.country.name} · ${facts.brand.name}`,
    title: facts.heading,
    highlight: facts.highlight,
    logos: logoFiles([facts.brand]),
  };
}

/** Heading, description and selling line of a section page, written from its real offers. */
function sectionFacts(data: CountryCatalog, operator: Operator, section: Section): SectionFacts {
  const entries = sectionEntries(data, operator.id, section);
  const prices = entries.flatMap((e) => (e.price_xof !== null && e.price_xof > 0 ? [e.price_xof] : []));
  const from = prices.length > 0 ? formatXof(Math.min(...prices)) : null;
  const money = operator.mobile_money ?? operator;
  const moneyName = money.former_names[0] ? `${money.name} (ex-${money.former_names[0]})` : money.name;
  const fromText = from ? `, dès ${from}` : '';
  const codes = entries.length > 0 ? `${entries.length} codes` : null;
  /** "18 forfaits internet", or "Forfaits internet" when the section is still empty. */
  const lead = (noun: string): string => (entries.length > 0 ? `${entries.length} ${noun}` : noun.charAt(0).toUpperCase() + noun.slice(1));

  switch (section.id) {
    case 'internet':
      return {
        heading: `Forfaits internet ${operator.short_name}`,
        description: `${lead('forfaits internet')} ${operator.name}, du jour au mois${fromText}. Le code de chaque forfait se compose en un tap.`,
        highlight: popularOffer(data, operator, entries) ?? (from ? `Dès ${from}` : null),
        brand: operator,
      };
    case 'appels':
      return {
        heading: `Appels et SMS ${operator.short_name}`,
        description: `${lead('forfaits appels et SMS')} ${operator.name}${fromText}. Le code se compose en un tap.`,
        highlight: from ? `Dès ${from}` : codes,
        brand: operator,
      };
    case 'argent':
      return {
        heading: `Codes ${money.short_name}`,
        description: `${lead('codes')} ${moneyName} prêts à composer. Telko ne demande jamais votre code secret.`,
        highlight: codes,
        brand: money,
      };
    case 'factures':
      return {
        heading: `Factures avec ${operator.short_name}`,
        description: `${lead('codes')} pour payer vos factures avec ${operator.name}, prêts à composer.`,
        highlight: codes,
        brand: operator,
      };
    case 'frais': {
      const fees = data.fees.filter((f) => f.operator === operator.id).length;

      return {
        heading: `Frais ${money.short_name}`,
        description: fees > 0 ? `Les frais ${moneyName} : ${fees} montants, avec la source de chacun.` : `Les frais ${moneyName}, avec leur source.`,
        highlight: fees > 0 ? `${fees} montants` : null,
        brand: money,
      };
    }
    default:
      return {
        heading: `Codes utiles ${operator.short_name}`,
        description: `${lead('codes utiles')} ${operator.name} : solde, numéro et services, en un tap.`,
        highlight: codes,
        brand: operator,
      };
  }
}

/** The operator's most asked offer of this section, from the editorial selection, as "5 Go · 599 F". */
function popularOffer(data: CountryCatalog, operator: Operator, entries: CatalogEntry[]): string | null {
  const listed = new Set(entries.map((e) => e.id));
  const entry = featuredFor(data, operator.id).find((f) => listed.has(f.entry.id))?.entry;
  const volume = formatData(entry?.allowances?.data_mb ?? null);
  if (!entry || entry.price_xof === null || !volume) return null;

  return `${volume} · ${formatXof(entry.price_xof)}`;
}

/** Logos follow the same switch as the app, pending legal review. */
function logoFiles(brands: Brand[]): string[] {
  return SHOW_BRAND_LOGOS ? brands.flatMap((b) => (b.logo ? [b.logo] : [])) : [];
}

/** The version changes with the content, so link previews fetch the image again when a price changes. */
function imagePath(card: ShareCard): string {
  return `/og/${card.slug}.png?v=${fingerprint(JSON.stringify(card))}`;
}

/** "Yas et Moov", "Mixx, Flooz et factures". */
function joinFr(items: string[]): string {
  if (items.length <= 1) return items.join('');

  return `${items.slice(0, -1).join(', ')} et ${items.at(-1) ?? ''}`;
}
