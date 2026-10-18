import { describe, expect, it } from 'vitest';

import { loadCatalog } from '../src/lib/catalog';
import type { CatalogFee } from '../src/lib/catalog-types';
import { feeAmount, feeCondition } from '../src/lib/fee-text';
import { localizeCatalog, localizeEntry } from '../src/lib/localize';
import { entrySchema } from '../src/lib/schema';

const catalog = loadCatalog();
const sample = catalog.byCountry.get('tg')?.entries.find((e) => e.ussd.params.length > 0);
if (!sample) throw new Error('tg needs an entry with parameters');

describe('translations', () => {
  it('refuses unknown keys in an English block', () => {
    const { country, operator, category, duration, ...raw } = sample;

    expect(entrySchema.safeParse({ ...raw, en: { nmae: 'Typo' } }).success).toBe(false);
    expect(entrySchema.safeParse({ ...raw, en: { name: 'Fine' } }).success).toBe(true);
  });

  it('falls back to French field by field and strips the English blocks', () => {
    const param = sample.ussd.params[0];
    if (!param) throw new Error('missing param');
    const entry = { ...sample, en: { name: 'English name' }, ussd: { ...sample.ussd, params: [{ ...param, en: { label: 'English label' } }] } };

    const english = localizeEntry(entry, 'en');
    expect(english.name).toBe('English name');
    expect(english.description).toBe(sample.description);
    expect(english.ussd.params[0]?.label).toBe('English label');
    expect(english.en).toBeUndefined();
    expect(english.ussd.params[0]?.en).toBeUndefined();

    const french = localizeEntry(entry, 'fr');
    expect(french.name).toBe(sample.name);
    expect(french.ussd.params[0]?.label).toBe(param.label);
  });

  it('keeps the period of every offer whatever the language', () => {
    const fr = catalog.byCountry.get('tg')?.entries ?? [];
    const en = localizeCatalog(catalog, 'en').byCountry.get('tg')?.entries ?? [];

    expect(en.map((e) => e.duration)).toEqual(fr.map((e) => e.duration));
  });
});

describe('fee labels', () => {
  const fee = (label: string): CatalogFee => ({ ...feeFixture, label });
  const words = { free: 'Free', unpublished: 'Not published' };

  it('splits a condition from its amount in both languages', () => {
    expect(feeCondition(fee('De 1 à 5 000 F : 100 F'))).toBe('De 1 à 5 000 F');
    expect(feeCondition(fee('From 1 to 5,000 F: 100 F'))).toBe('From 1 to 5,000 F');
    expect(feeAmount(fee('Retrait : entre 100 et 500 F'), words, ',')).toBe('100 – 500 F');
    expect(feeAmount(fee('Withdrawal: between 100 and 500 F'), words, '.')).toBe('100 – 500 F');
    expect(feeAmount(fee('Withdrawal: varies'), words, '.')).toBe('Not published');
  });
});

const feeFixture: CatalogFee = {
  id: 'x',
  operation: 'withdrawal',
  min_xof: 0,
  max_xof: null,
  fee_xof: null,
  fee_percent: null,
  label: 'x',
  provenance: { status: 'unverified', sources: [{ url: 'https://example.com', kind: 'official', accessed: '2026-10-18' }], verified_at: null, verified_by: null },
  notes: null,
  country: 'tg',
  operator: 'yas',
  service: 'x',
};
