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

describe('data rules', () => {
  const base = {
    '/data/countries.json': { countries: [{ code: 'tg', name: 'Togo', status: 'live', dial_code: '228', currency: 'XOF' }] },
    '/data/tg/operators.json': {
      country: 'tg',
      operators: [{ id: 'yas', name: 'Yas', short_name: 'Yas', former_names: [], badge: { label: 'Y', background: '#00377D', foreground: '#FFFFFF' }, logo: null, mobile_money: null, prefixes: [], website: 'https://yas.tg', customer_service: '888', notes: null }],
    },
  };
  const source = { url: 'https://example.org', kind: 'secondary', accessed: '2026-10-18' };
  const entry = (over: Record<string, unknown>) => ({
    id: 'yas-internet-x', kind: 'bundle', name: 'X', description: '', price_xof: 100,
    allowances: null, validity: null, time_window: null, ussd: { template: '*1#', params: [] },
    payment_methods: [], third_party: null, tags: [],
    provenance: { status: 'unverified', sources: [source], verified_at: null, verified_by: null }, notes: null, ...over,
  });
  const withEntry = (e: unknown, path = '/data/tg/yas/internet.json', operator = 'yas') => ({
    ...base, [path]: { operator, category: 'internet', entries: [e] },
  });

  it('rejects a file whose operator does not match its folder', () => {
    expect(() => loadCatalog(withEntry(entry({}), '/data/tg/yas/internet.json', 'yaz'))).toThrow(/must match its folder/);
  });

  it('rejects malformed placeholders', () => {
    expect(() => loadCatalog(withEntry(entry({ ussd: { template: '*155*{PIN}#', params: [] } })))).toThrow(/braces/);
  });

  it('rejects a verified entry backed only by secondary sources', () => {
    const verified = { status: 'verified', sources: [source], verified_at: '2026-10-18', verified_by: 'someone' };

    expect(() => loadCatalog(withEntry(entry({ provenance: verified })))).toThrow(/accepted proof/);
  });

  it('marks old verifications as stale', () => {
    const verified = { status: 'verified', sources: [{ ...source, kind: 'official' }], verified_at: '2026-01-01', verified_by: 'someone' };
    const loaded = loadCatalog(withEntry(entry({ provenance: verified })), new Date('2026-10-18'));

    expect(loaded.byCountry.get('tg')?.entries[0]?.provenance.status).toBe('stale');
  });

  it('rejects a fee with both a flat amount and a percentage', () => {
    const fee = { id: 'yas-fees-x', operation: 'withdrawal', min_xof: 1, max_xof: 10, fee_xof: 0, fee_percent: 1, label: 'x', provenance: { status: 'unverified', sources: [source], verified_at: null, verified_by: null }, notes: null };
    const files = { ...base, '/data/tg/yas/fees.json': { operator: 'yas', service: 'mixx', entries: [fee] } };

    expect(() => loadCatalog(files)).toThrow(/either fee_xof or fee_percent/);
  });
});
