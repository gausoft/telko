import { describe, expect, it } from 'vitest';

import { existsSync } from 'node:fs';

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
    const prices = entriesFor(tg, 'yas', 'internet').map((e) => e.price ?? 0);

    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('labels every amount with the currency of its country', () => {
    const tg = catalog.byCountry.get('tg');
    if (!tg) throw new Error('tg missing');

    expect([...tg.entries, ...tg.fees].every((e) => e.amountLabel === 'F')).toBe(true);
  });

  it('has a flag for every country, live or soon', () => {
    const missing = catalog.countries.filter((c) => !existsSync(`public/flags/${c.code}.svg`)).map((c) => c.code);

    expect(missing).toEqual([]);
  });

  it('publishes no country without an operator', () => {
    const empty = [...catalog.byCountry.values()].filter((data) => data.operators.length === 0).map((data) => data.country.code);

    expect(empty).toEqual([]);
  });

  it('rejects a file that breaks the schema, naming the file', () => {
    const broken = { '/data/countries.json': { countries: [{ code: 'tg', name: 'Togo', status: 'live', dial_code: '228', national_length: 8, currency: 'XOF', amount_label: 'F', amount_presets: [500, 1000] }] }, '/data/tg/operators.json': { country: 'tg', operators: [] }, '/data/tg/x/internet.json': { operator: 'x', category: 'internet', entries: [{ id: 'BAD ID' }] } };

    expect(() => loadCatalog(broken)).toThrow(/\/data\/tg\/x\/internet\.json/);
  });
});

describe('data rules', () => {
  const country = { code: 'tg', name: 'Togo', status: 'live', dial_code: '228', national_length: 8, currency: 'XOF', amount_label: 'F', amount_presets: [500, 1000] };
  const yas = {
    id: 'yas', name: 'Yas', short_name: 'Yas', former_names: [], badge: { label: 'Y', background: '#00377D', foreground: '#FFFFFF' }, logo: null, mobile_money: null, prefixes: [], website: 'https://yas.tg', customer_service: '888',
    provenance: { status: 'unverified', sources: [{ url: 'https://yas.tg/particulier/assistance/', kind: 'official', accessed: '2026-10-18' }], verified_at: null, verified_by: null },
    notes: null,
  };
  const base = {
    '/data/countries.json': { countries: [country] },
    '/data/tg/operators.json': { country: 'tg', operators: [yas] },
  };
  const source = { url: 'https://example.org', kind: 'secondary', accessed: '2026-10-18' };
  const entry = (over: Record<string, unknown>) => ({
    id: 'yas-internet-x', kind: 'bundle', name: 'X', description: '', price: 100,
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
    const fee = { id: 'yas-fees-x', operation: 'withdrawal', min: 1, max: 10, fee: 0, fee_percent: 1, label: 'x', provenance: { status: 'unverified', sources: [source], verified_at: null, verified_by: null }, notes: null };
    const files = { ...base, '/data/tg/yas/fees.json': { operator: 'yas', service: 'mixx', entries: [fee] } };

    expect(() => loadCatalog(files)).toThrow(/either fee or fee_percent/);
  });

  it('reads a country in its own currency', () => {
    const ghana = { ...country, code: 'gh', name: 'Ghana', dial_code: '233', currency: 'GHS', amount_label: 'GH₵' };
    const files = {
      '/data/countries.json': { countries: [ghana] },
      '/data/gh/operators.json': { country: 'gh', operators: [{ ...yas, id: 'mtn', website: 'https://mtn.com.gh' }] },
      '/data/gh/mtn/internet.json': { operator: 'mtn', category: 'internet', entries: [entry({ id: 'mtn-internet-x', price: 25 })] },
    };

    expect(loadCatalog(files).byCountry.get('gh')?.entries[0]?.amountLabel).toBe('GH₵');
  });

  it('rejects a payment method the operator does not offer', () => {
    expect(() => loadCatalog(withEntry(entry({ payment_methods: ['orange-money'] })))).toThrow(/which yas does not offer/);
  });

  it('rejects a payment method of another operator', () => {
    const money = { id: 'flooz', name: 'Flooz', short_name: 'Flooz', former_names: [], badge: { label: 'F', background: '#0055A5', foreground: '#FFFFFF' }, logo: null };
    const moov = { ...yas, id: 'moov', name: 'Moov', website: 'https://moov.tg', mobile_money: money };
    const files = {
      '/data/countries.json': base['/data/countries.json'],
      '/data/tg/operators.json': { country: 'tg', operators: [yas, moov] },
      '/data/tg/yas/internet.json': { operator: 'yas', category: 'internet', entries: [entry({ payment_methods: ['flooz'] })] },
    };

    expect(() => loadCatalog(files)).toThrow(/which yas does not offer/);
  });

  it('accepts airtime and the mobile money service of the operator itself', () => {
    const money = { id: 'mixx', name: 'Mixx by Yas', short_name: 'Mixx', former_names: [], badge: { label: 'Mx', background: '#FFD100', foreground: '#00377D' }, logo: null };
    const files = {
      '/data/countries.json': base['/data/countries.json'],
      '/data/tg/operators.json': { country: 'tg', operators: [{ ...yas, mobile_money: money }] },
      '/data/tg/yas/internet.json': { operator: 'yas', category: 'internet', entries: [entry({ payment_methods: ['airtime', 'mixx'] })] },
    };

    expect(loadCatalog(files).byCountry.get('tg')?.entries[0]?.payment_methods).toEqual(['airtime', 'mixx']);
  });

  it('refuses a service number a visitor cannot dial as it is', () => {
    const withNumber = (customer_service: unknown) => ({ ...base, '/data/tg/operators.json': { country: 'tg', operators: [{ ...yas, customer_service }] } });

    expect(() => loadCatalog(withNumber('*155#'))).toThrow(/customer_service must be a diallable number/);
    expect(() => loadCatalog(withNumber('*155*1#'))).toThrow(/customer_service must be a diallable number/);
    expect(() => loadCatalog(withNumber('Service client'))).toThrow(/customer_service must be a diallable number/);
  });

  it('accepts a service number written with spaces, or no number at all', () => {
    const digits = loadCatalog({ ...base, '/data/tg/operators.json': { country: 'tg', operators: [{ ...yas, customer_service: '+228 99 99 00 00' }] } });
    const none = loadCatalog({ ...base, '/data/tg/operators.json': { country: 'tg', operators: [{ ...yas, customer_service: null }] } });

    expect(digits.byCountry.get('tg')?.operators[0]?.customer_service).toBe('+228 99 99 00 00');
    expect(none.byCountry.get('tg')?.operators[0]?.customer_service).toBeNull();
  });

  it('refuses a country without a single quick amount', () => {
    const empty = { ...country, amount_presets: [] };

    expect(() => loadCatalog({ ...base, '/data/countries.json': { countries: [empty] } })).toThrow(/amount_presets/);
  });

  it('refuses an operator verified without an accepted proof', () => {
    const verified = { ...yas, provenance: { status: 'verified', sources: [source], verified_at: '2026-10-18', verified_by: 'someone' } };

    expect(() => loadCatalog({ ...base, '/data/tg/operators.json': { country: 'tg', operators: [verified] } })).toThrow(/accepted proof/);
  });

  it('refuses a country marked live without a data folder', () => {
    expect(() => loadCatalog({ '/data/countries.json': base['/data/countries.json'] })).toThrow(/Missing data file \/data\/tg\/operators\.json/);
  });

  it('reads a country still soon once it has a folder, without building its pages', () => {
    const benin = { ...country, code: 'bj', name: 'Bénin', dial_code: '229', national_length: 10, status: 'soon' };
    const files = {
      ...base,
      '/data/countries.json': { countries: [country, benin] },
      '/data/bj/operators.json': { country: 'bj', operators: [{ ...yas, id: 'mtn', website: 'https://mtn.bj' }] },
    };
    const loaded = loadCatalog(files);

    expect(loaded.byCountry.has('bj')).toBe(false);
    expect(loaded.pending.get('bj')?.operators[0]?.id).toBe('mtn');
  });

  it('refuses a soon folder without operators.json, rather than ignoring it', () => {
    const benin = { ...country, code: 'bj', name: 'Bénin', dial_code: '229', national_length: 10, status: 'soon' };
    const files = {
      ...base,
      '/data/countries.json': { countries: [country, benin] },
      '/data/bj/mtn/internet.json': { operator: 'mtn', category: 'internet', entries: [entry({ id: 'mtn-internet-x' })] },
    };

    expect(() => loadCatalog(files)).toThrow(/Missing data file \/data\/bj\/operators\.json/);
  });

  it('names the faulty file of a country still soon', () => {
    const benin = { ...country, code: 'bj', name: 'Bénin', dial_code: '229', national_length: 10, status: 'soon' };
    const files = {
      ...base,
      '/data/countries.json': { countries: [country, benin] },
      '/data/bj/operators.json': { country: 'bj', operators: [{ ...yas, id: 'mtn' }] },
      '/data/bj/mtn/internet.json': { operator: 'yat', category: 'internet', entries: [] },
    };

    expect(() => loadCatalog(files)).toThrow(/\/data\/bj\/mtn\/internet\.json: operator "yat" must match its folder "mtn"/);
  });
});
