import { describe, expect, it } from 'vitest';

import { checkCode, issueUrl, PROOF_LABELS } from '../src/lib/contribution';
import type { ContributionDraft } from '../src/lib/contribution-types';

const draft: ContributionDraft = {
  operator: 'Yas Togo',
  service: 'Appels, SMS et Internet',
  contact: '',
  name: 'Net5000',
  code: '*909*5#',
  details: '5 000 F, 6 Go, 30 jours',
  proof: 'device',
  sourceUrl: '',
  date: '2026-11-09',
};

describe('contribution code check', () => {
  it('accepts real codes and placeholders', () => {
    for (const code of ['*909*5#', '#150#', '*155*1*1*{phone}*{amount}#', '*100*A1#', '*123']) expect(checkCode(code)).toBeNull();
  });

  it('rejects empty and malformed codes', () => {
    expect(checkCode('  ')).toBe('empty');
    for (const code of ['909', '*909 5#', '*', '*155*{code secret}#']) expect(checkCode(code)).toBe('format');
  });
});

describe('contribution issue link', () => {
  const target = { repoUrl: 'https://github.com/gausoft/telko', template: 'new-offer.yml' };

  it('fills the issue form fields', () => {
    const url = new URL(issueUrl(draft, target));
    expect(url.origin + url.pathname).toBe('https://github.com/gausoft/telko/issues/new');
    expect(url.searchParams.get('template')).toBe('new-offer.yml');
    expect(url.searchParams.get('title')).toBe('[Offre] Net5000');
    expect(url.searchParams.get('code')).toBe('*909*5#');
    expect(url.searchParams.get('proof')).toBe(PROOF_LABELS.device);
    expect(url.searchParams.get('date')).toBe('2026-11-09');
  });

  it('keeps special characters intact', () => {
    const url = new URL(issueUrl({ ...draft, details: 'a&b=c #1' }, target));
    expect(url.searchParams.get('details')).toBe('a&b=c #1');
  });
});
