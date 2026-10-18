import { describe, expect, it } from 'vitest';

import { loadCatalog } from '../src/lib/catalog';
import { encodeUssd, telHref } from '../src/lib/dial';
import { formatData, formatXof, pricePerGb } from '../src/lib/format';
import { buildDocs, normalize, search } from '../src/lib/search';

describe('format', () => {
  it('formats CFA francs with a thin space', () => {
    expect(formatXof(50600)).toBe('50 600 F');
  });

  it('formats data volumes', () => {
    expect(formatData(5120)).toBe('5 Go');
    expect(formatData(1536)).toBe('1,5 Go');
    expect(formatData(45)).toBe('45 Mo');
    expect(formatData(-1)).toBe('Illimité');
  });

  it('computes the price per GB', () => {
    expect(pricePerGb(599, 5120)).toBe(120);
    expect(pricePerGb(100, null)).toBeNull();
  });
});

describe('dial', () => {
  it('encodes # for tel: links', () => {
    expect(encodeUssd('*909*241#')).toBe('*909*241%23');
  });

  it('links codes without parameters only', () => {
    expect(telHref({ ussd: { template: '*909*241#', params: [] } })).toBe('tel:*909*241%23');
    expect(telHref({ ussd: { template: '*155*1*1*{phone}#', params: [{ name: 'phone', type: 'phone', label: 'Numéro', required: true }] } })).toBeNull();
  });
});

describe('search', () => {
  const docs = buildDocs(loadCatalog());

  it('normalizes accents and case', () => {
    expect(normalize('Illimité MIXX')).toBe('illimite mixx');
  });

  it('finds Yas bundles payable with Mixx by its former name', () => {
    const hits = search(docs, 'tmoney 5 go', 'tg');

    expect(hits.some((h) => h.doc.operator === 'yas')).toBe(true);
  });

  it('finds the balance code', () => {
    const hits = search(docs, 'solde yas', 'tg');

    expect(hits[0]?.doc.code).toBe('*909*0#');
  });

  it('puts the current country first', () => {
    const foreign = { ...docs[0]!, id: 'zz-1', country: 'bj' };
    const hits = search([foreign, ...docs], docs[0]!.title, 'tg');

    expect(hits[0]?.local).toBe(true);
  });

  it('returns nothing for an empty query', () => {
    expect(search(docs, '   ', 'tg')).toEqual([]);
  });
});

describe('search quantities and codes', () => {
  const docs = buildDocs(loadCatalog());

  it('keeps "1,5 Go" apart from "5 go"', () => {
    const titles = search(docs, '5 go', 'tg').map((h) => h.doc.title);

    expect(titles).toContain('5 Go');
    expect(titles).not.toContain('1,5 Go');
  });

  it('finds an offer by its USSD code', () => {
    expect(search(docs, '*909*232#', 'tg')[0]?.doc.code).toBe('*909*232#');
  });

  it('finds an offer by its price', () => {
    expect(search(docs, '599', 'tg').some((h) => h.doc.code === '*909*241#')).toBe(true);
  });
});
