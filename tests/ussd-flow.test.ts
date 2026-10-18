import { describe, expect, it } from 'vitest';

import { loadCatalog } from '../src/lib/catalog';
import { buildCode, codeTokens, dialTokens, normalizePhone, planSteps, validateStep } from '../src/lib/ussd-flow';

const togo = { dialCode: '228', nationalLength: 8, homeDialCode: '228' };
const entries = [...loadCatalog().byCountry.values()].flatMap((c) => c.entries).filter((e) => e.ussd.params.length > 0);
const byId = (id: string) => {
  const entry = entries.find((e) => e.id === id);
  if (!entry) throw new Error(`missing ${id}`);

  return entry.ussd;
};

describe('ussd flow on every real code', () => {
  it('covers the codes to complete', () => {
    expect(entries.length).toBeGreaterThanOrEqual(20);
  });

  it('never asks for a secret code', () => {
    for (const e of entries) expect(planSteps(e.ussd).every((s) => s.type !== 'pin')).toBe(true);
  });

  it('never puts a secret placeholder in the prepared code', () => {
    for (const e of entries) {
      const values = Object.fromEntries(planSteps(e.ussd).map((s) => [s.name, '1']));
      const built = buildCode(e.ussd, values);
      const secrets = e.ussd.params.filter((p) => p.type === 'pin').map((p) => p.name);

      expect(built.complete).toBe(true);
      expect(built.code).not.toMatch(/[{}]/);
      expect(built.code).toMatch(/#$/);
      expect(built.code).not.toMatch(/\*#$/);
      expect(built.needsSecret).toBe(secrets.length > 0);
      for (const name of secrets) expect(built.code).not.toContain(name);

      const withSecret = { ...values, ...Object.fromEntries(secrets.map((n) => [n, '987654'])) };
      expect(buildCode(e.ussd, withSecret).code).not.toContain('987654');
      expect(dialTokens(e.ussd, withSecret).some((t) => t.kind === 'slot' && t.value === '987654')).toBe(false);
    }
  });
});

describe('planSteps and buildCode', () => {
  it('stops a Moov Money transfer before the secret code and closes it with #', () => {
    const ussd = byId('moov-mobile-money-transfert-national');

    expect(planSteps(ussd).map((s) => s.name)).toEqual(['phone', 'amount']);
    expect(buildCode(ussd, { phone: '90000000', amount: '500' })).toEqual({ code: '*155*1*1*90000000*500#', needsSecret: true, complete: true });
  });

  it('asks a repeated box once and fills it twice', () => {
    const ussd = byId('moov-bills-canal-plus-nouvelle-carte');

    expect(planSteps(ussd).map((s) => s.name)).toEqual(['card_number']);
    expect(buildCode(ussd, { card_number: '123' }).code).toBe('*155*4*8*3*2*123*123#');
  });

  it('builds a full code with # when no secret code is needed', () => {
    expect(buildCode(byId('moov-general-moov-bip'), { phone: '90000000' })).toEqual({ code: '*108*90000000#', needsSecret: false, complete: true });
  });

  it('shows the dialed code without the secret box', () => {
    const tokens = dialTokens(byId('moov-mobile-money-transfert-national'), { phone: '90000000', amount: '500' });
    const text = tokens.map((t) => (t.kind === 'text' ? t.text : t.value)).join('');

    expect(text).toBe('*155*1*1*90000000*500#');
  });

  it('reports an empty box', () => {
    expect(buildCode(byId('moov-general-moov-bip'), {}).complete).toBe(false);
  });

  it('shows short labels in the one-line code', () => {
    const shorts = codeTokens(byId('moov-mobile-money-transfert-national')).flatMap((t) => (t.kind === 'slot' ? [t.short] : []));

    expect(shorts).toEqual(['Numéro', 'Montant', 'Code']);
  });
});

describe('inputs', () => {
  it('normalizes Togolese numbers', () => {
    expect(normalizePhone('+228 90 00 00 00', 'national', togo)).toEqual({ ok: true, value: '90000000' });
    expect(normalizePhone('0022890000000', 'national', togo)).toEqual({ ok: true, value: '90000000' });
    expect(normalizePhone('9000 000', 'national', togo).ok).toBe(false);
  });

  it('refuses a foreign number for a national-only code', () => {
    expect(normalizePhone('0100000000', 'national', { dialCode: '229', nationalLength: 10, homeDialCode: '228' }).ok).toBe(false);
  });

  it('adds the country code for international transfers', () => {
    expect(normalizePhone('01 00 00 00 00', 'international', { dialCode: '229', nationalLength: 10, homeDialCode: '228' })).toEqual({ ok: true, value: '2290100000000' });
  });

  it('checks amounts and text', () => {
    const [, amount] = planSteps(byId('moov-mobile-money-transfert-national'));
    if (!amount) throw new Error('missing amount step');

    expect(validateStep(amount, '5 000', togo)).toEqual({ ok: true, value: '5000' });
    expect(validateStep(amount, '5.000', togo)).toEqual({ ok: true, value: '5000' });
    for (const bad of ['500.50', '-500', '500#1000', '5,5', '1e3', '50 00']) expect(validateStep(amount, bad, togo).ok).toBe(false);
    expect(validateStep(amount, '0', togo).ok).toBe(false);
    expect(validateStep({ ...amount, min: 100 }, '50', togo).ok).toBe(false);

    const [year] = planSteps(byId('moov-bills-universite-lome-nouveau'));
    if (!year) throw new Error('missing year step');
    expect(validateStep(year, '2024', togo).ok).toBe(true);
    expect(validateStep(year, '24', togo).ok).toBe(false);
    expect(validateStep(year, '20#4', togo).ok).toBe(false);
    expect(validateStep(year, '20a4', togo).ok).toBe(false);
  });
});
