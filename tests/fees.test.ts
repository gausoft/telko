import { describe, expect, it } from 'vitest';

import { messages } from '../src/i18n/messages';
import { LANGS } from '../src/i18n/i18n-types';
import { loadCatalog } from '../src/lib/catalog';
import { FEE_PAGE_AMOUNTS, parseAmount, quoteFor } from '../src/lib/fee-lookup';
import { toFeeRows } from '../src/lib/fee-rows';
import { feeAmountPaths } from '../src/lib/fee-routes';
import { localizeCatalog } from '../src/lib/localize';
import { feeAmountSeo } from '../src/lib/seo-fee';

const OPERATIONS = Object.keys(messages('fr').fees.operations);

function rowsOf(lang: 'fr' | 'en') {
  const data = localizeCatalog(loadCatalog(), lang).byCountry.get('tg');
  if (!data) throw new Error('tg missing');

  return { data, rows: toFeeRows(data.fees, messages(lang).fees, lang === 'fr' ? ',' : '.') };
}

describe('fee lookup', () => {
  const { rows } = rowsOf('fr');
  const withdrawal = (operator: string, amount: number) =>
    quoteFor(rows, operator, amount, OPERATIONS)
      .groups.find((g) => g.operation === 'withdrawal')
      ?.rows.map((r) => ({ ...r, amount: r.amount.replace(/\s/g, ' ') }));

  it('uses the band that contains the amount, ends included', () => {
    expect(withdrawal('yas', 50000)?.map((r) => r.amount)).toEqual(['600 F']);
    expect(withdrawal('yas', 50001)?.map((r) => r.amount)).toEqual(['1 000 F']);
    expect(withdrawal('yas', 500)?.map((r) => r.amount)).toEqual(['50 F']);
    expect(withdrawal('yas', 501)?.map((r) => r.amount)).toEqual(['100 F']);
  });

  it('keeps the published wording when a fee has no figure', () => {
    expect(withdrawal('moov', 150000)?.[0]?.amount).toContain('3 169');
  });

  it('gives exactly one withdrawal band per searched amount and service', () => {
    for (const operator of ['yas', 'moov']) for (const amount of FEE_PAGE_AMOUNTS) expect(withdrawal(operator, amount)).toHaveLength(1);
  });

  it('reads typed amounts and refuses the rest', () => {
    expect(parseAmount('50 000')).toBe(50000);
    expect(parseAmount('50000 F')).toBe(50000);
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('2000001')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('1,5')).toBeNull();
    expect(parseAmount('50,5')).toBeNull();
    expect(parseAmount('50.000')).toBe(50000);
    expect(parseAmount('')).toBeNull();
  });
});

describe('fee pages', () => {
  it('builds the same pages in both languages, with an answer in the description', () => {
    expect(feeAmountPaths('fr').map((p) => p.params)).toEqual(feeAmountPaths('en').map((p) => p.params));

    for (const lang of LANGS) {
      const { data } = rowsOf(lang);
      const operator = data.operators[0];
      if (!operator) throw new Error('no operator');

      const seo = feeAmountSeo(data, operator, 50000, lang);
      expect(seo.description).toMatch(/600 F/);
      expect(seo.description.length).toBeLessThanOrEqual(160);
      expect(seo.path).toContain(`/tg/${operator.id}/frais/50000`);
    }
  });
});
