import type { Lang } from '../i18n/i18n-types';
import type { Catalog, CatalogEntry } from './catalog-types';
import { formatData, formatXof } from './format';
import { localizeEntry } from './localize';
import type { Operator } from './schema';
import type { SearchDoc, SearchHit } from './search-types';

/** English searches also reach French words: tags stay French, and French speakers often type them. */
const SYNONYMS: Record<Lang, Record<string, string[]>> = {
  fr: {
    illimite: ['illimite', 'non', 'stop', 'nonstop'],
    internet: ['internet', 'net', 'data', 'izi', 'go', 'mo'],
    appel: ['appel', 'appels', 'voix', 'lema', 'minutes'],
    solde: ['solde', 'consulter', 'balance'],
    transfert: ['transfert', 'envoyer', 'envoi'],
    frais: ['frais', 'tarif'],
    annuler: ['annuler', 'annulation', 'rappel'],
  },
  en: {
    unlimited: ['unlimited', 'illimite', 'nonstop'],
    data: ['data', 'internet', 'net', 'go', 'mo'],
    internet: ['internet', 'data', 'net', 'go', 'mo'],
    call: ['call', 'appel', 'voix', 'minutes'],
    calls: ['call', 'appel', 'voix', 'minutes'],
    balance: ['balance', 'solde', 'consulter'],
    transfer: ['transfer', 'send', 'transfert', 'envoyer'],
    send: ['send', 'transfer', 'transfert', 'envoyer'],
    fee: ['fee', 'frais', 'tarif'],
    fees: ['fee', 'frais', 'tarif'],
    cancel: ['cancel', 'annuler', 'annulation'],
  },
};

const QUANTITY = /(\d+(?:[.,]\d+)?)\s*(go|gb|mo|mb|min|f|fcfa|cfa)\b/g;
/** "5 GB" and "5 go" are the same search: units are written one way in the index. */
const UNIT: Record<string, string> = { gb: 'go', mb: 'mo', fcfa: 'f', cfa: 'f' };

export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Splits text into search tokens; "1,5 Go" stays one token ("1.5go") so it never matches "5 go". */
export function tokenize(text: string): string[] {
  const glued = normalize(text).replace(QUANTITY, (_, n: string, unit: string) => ` ${n.replace(',', '.')}${UNIT[unit] ?? unit} `);

  return glued.split(/[^a-z0-9.]+/).map((t) => t.replace(/^\.+|\.+$/g, '')).filter((t) => t.length > 0);
}

/** `catalog` is the source (French) catalog: in English, documents show English text and match both languages. */
export function buildDocs(catalog: Catalog, lang: Lang = 'fr'): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const country of catalog.byCountry.values()) {
    const operators = new Map(country.operators.map((o) => [o.id, o]));
    for (const entry of country.entries) {
      if (entry.provenance.status === 'discontinued') continue;
      docs.push(toDoc(entry, operators.get(entry.operator), lang));
    }
  }

  return docs;
}

function toDoc(source: CatalogEntry, operator: Operator | undefined, lang: Lang): SearchDoc {
  const entry = localizeEntry(source, lang);
  const volume = formatData(entry.allowances?.data_mb ?? null, lang);
  const price = entry.price_xof !== null ? formatXof(entry.price_xof) : null;
  const parts = [volume ? entry.name : null, entry.validity?.label ?? null, price];
  const brandNames = operator ? brandTerms(operator, entry) : [];
  const codeDigits = entry.ussd.template.replace(/\{[a-z_]+\}/g, ' ').replace(/[*#]/g, ' ');
  const french = lang === 'fr' ? [] : [source.name, source.description, source.validity?.label ?? ''];
  const text = [
    entry.name, entry.description, entry.category, ...entry.tags, ...brandNames, ...french,
    volume ?? '', entry.validity?.label ?? '', codeDigits, price ?? '', entry.price_xof !== null ? String(entry.price_xof) : '',
  ].join(' ');

  return {
    id: entry.id,
    country: entry.country,
    operator: entry.operator,
    title: volume ?? entry.name,
    subtitle: parts.filter((p): p is string => p !== null).join(' · '),
    code: entry.ussd.template,
    dialable: entry.ussd.params.length === 0,
    terms: Array.from(new Set(tokenize(text))),
  };
}

function brandTerms(operator: Operator, entry: CatalogEntry): string[] {
  const names = [operator.name, operator.short_name, ...operator.former_names];
  const usesMobileMoney = entry.category === 'mobile-money' || entry.payment_methods.some((m) => m !== 'airtime');

  if (operator.mobile_money && usesMobileMoney) {
    names.push(operator.mobile_money.name, operator.mobile_money.short_name, ...operator.mobile_money.former_names);
  }

  return names;
}

export function search(docs: SearchDoc[], query: string, country: string, lang: Lang = 'fr', limit = 20): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const score = scoreDoc(doc, tokens, SYNONYMS[lang]);
    if (score > 0) hits.push({ doc, score, local: doc.country === country });
  }

  hits.sort((a, b) => Number(b.local) - Number(a.local) || b.score - a.score || a.doc.title.localeCompare(b.doc.title));

  return hits.slice(0, limit);
}

function scoreDoc(doc: SearchDoc, tokens: string[], synonyms: Record<string, string[]>): number {
  const titleTokens = tokenize(doc.title);
  let score = 0;

  for (const token of tokens) {
    const isQuantity = /^\d/.test(token);
    const variants = synonyms[token] ?? [token];
    const matched = variants.some((v) => doc.terms.some((t) => (isQuantity ? t === v : t.startsWith(v))));
    if (!matched) return 0;
    score += titleTokens.includes(token) ? 2 : 1;
  }

  return score;
}
