import type { Catalog, CatalogEntry } from './catalog-types';
import { formatData, formatXof } from './format';
import type { Operator } from './schema';
import type { SearchDoc, SearchHit } from './search-types';

const SYNONYMS: Record<string, string[]> = {
  illimite: ['illimite', 'non', 'stop', 'nonstop'],
  internet: ['internet', 'net', 'data', 'izi', 'go', 'mo'],
  appel: ['appel', 'appels', 'voix', 'lema', 'minutes'],
  solde: ['solde', 'consulter', 'balance'],
  transfert: ['transfert', 'envoyer', 'envoi'],
  frais: ['frais', 'tarif'],
  annuler: ['annuler', 'annulation', 'rappel'],
};

export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function tokenize(text: string): string[] {
  return normalize(text).split(/[^a-z0-9]+/).filter((t) => t.length > 0);
}

export function buildDocs(catalog: Catalog): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const country of catalog.byCountry.values()) {
    const operators = new Map(country.operators.map((o) => [o.id, o]));
    for (const entry of country.entries) {
      if (entry.provenance.status === 'discontinued') continue;
      docs.push(toDoc(entry, operators.get(entry.operator)));
    }
  }

  return docs;
}

function toDoc(entry: CatalogEntry, operator: Operator | undefined): SearchDoc {
  const volume = formatData(entry.allowances?.data_mb ?? null);
  const title = volume ?? entry.name;
  const parts = [volume ? entry.name : null, entry.validity?.label ?? null, entry.price_xof !== null ? formatXof(entry.price_xof) : null];
  const brandNames = operator ? brandTerms(operator, entry) : [];
  const text = [entry.name, entry.description, entry.category, ...entry.tags, ...brandNames, volume ?? '', entry.validity?.label ?? ''].join(' ');

  return {
    id: entry.id,
    country: entry.country,
    operator: entry.operator,
    title,
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

export function search(docs: SearchDoc[], query: string, country: string, limit = 20): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const score = scoreDoc(doc, tokens);
    if (score > 0) hits.push({ doc, score, local: doc.country === country });
  }

  hits.sort((a, b) => Number(b.local) - Number(a.local) || b.score - a.score || a.doc.title.localeCompare(b.doc.title));

  return hits.slice(0, limit);
}

function scoreDoc(doc: SearchDoc, tokens: string[]): number {
  let score = 0;

  for (const token of tokens) {
    const variants = SYNONYMS[token] ?? [token];
    const matched = variants.some((v) => doc.terms.some((t) => t.startsWith(v)));
    if (!matched) return 0;
    score += normalize(doc.title).includes(token) ? 2 : 1;
  }

  return score;
}
