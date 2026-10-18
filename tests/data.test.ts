import { describe, expect, it } from 'vitest';

import { entriesFor, featuredFor, loadCatalog } from '../src/lib/catalog';

const catalog = loadCatalog();

describe('dataset', () => {
  it('loads every live country without schema errors', () => {
    expect(catalog.byCountry.has('tg')).toBe(true);
  });

  it('keeps entry ids unique across the dataset', () => {
    const ids = [...catalog.byCountry.values()].flatMap((c) => [...c.entries.map((e) => e.id), ...c.fees.map((f) => f.id)]);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never ships a verified entry without a verification date', () => {
    const bad = [...catalog.byCountry.values()].flatMap((c) => c.entries).filter((e) => e.provenance.status === 'verified' && !e.provenance.verified_at);

    expect(bad).toEqual([]);
  });

  it('resolves every featured item to an entry of the same country', () => {
    const tg = catalog.byCountry.get('tg');

    expect(tg?.featured.length).toBeGreaterThan(0);
    expect(tg?.featured.every((f) => f.entry.country === 'tg')).toBe(true);
  });

  it('filters featured items by operator', () => {
    const tg = catalog.byCountry.get('tg');
    if (!tg) throw new Error('tg missing');

    expect(featuredFor(tg, 'yas').every((f) => f.entry.operator === 'yas')).toBe(true);
  });

  it('sorts offers by price', () => {
    const tg = catalog.byCountry.get('tg');
    if (!tg) throw new Error('tg missing');
    const prices = entriesFor(tg, 'yas', 'internet').map((e) => e.price_xof ?? 0);

    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('rejects a file that breaks the schema, naming the file', () => {
    const broken = { '/data/countries.json': { countries: [{ code: 'tg', name: 'Togo', status: 'live', dial_code: '228', currency: 'XOF' }] }, '/data/tg/operators.json': { country: 'tg', operators: [] }, '/data/tg/x/internet.json': { operator: 'x', category: 'internet', entries: [{ id: 'BAD ID' }] } };

    expect(() => loadCatalog(broken)).toThrow(/\/data\/tg\/x\/internet\.json/);
  });
});
