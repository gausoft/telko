import { describe, expect, it } from 'vitest';

import { LANGS } from '../src/i18n/i18n-types';
import { loadCatalog } from '../src/lib/catalog';
import { localizeCatalog } from '../src/lib/localize';
import { sectionSeo, shareCards } from '../src/lib/seo';
import { SECTIONS } from '../src/lib/sections';

const catalog = loadCatalog();
const togo = catalog.byCountry.get('tg');

describe('page SEO', () => {
  it('never announces an empty count, in any language', () => {
    for (const lang of LANGS) {
      const data = localizeCatalog(catalog, lang).byCountry.get('tg');
      if (!data) throw new Error('tg missing');

      for (const operator of data.operators) {
        for (const section of SECTIONS) {
          const seo = sectionSeo(data, operator, section, lang);
          expect(seo.description).not.toMatch(/\b0 (codes|forfaits|montants|amounts|data|call|useful)/);
          expect(seo.description.length).toBeLessThanOrEqual(160);
        }
      }
    }
  });

  it('links each language version of a page to the others', () => {
    const data = localizeCatalog(catalog, 'en').byCountry.get('tg');
    const yas = data?.operators.find((o) => o.id === 'yas');
    const internet = SECTIONS.find((s) => s.id === 'internet');
    if (!data || !yas || !internet) throw new Error('tg/yas/internet missing');

    const seo = sectionSeo(data, yas, internet, 'en');
    expect(seo.path).toBe('/en/tg/yas/internet');
    expect(seo.alternates).toEqual([
      { hreflang: 'fr', path: '/tg/yas/internet' },
      { hreflang: 'en', path: '/en/tg/yas/internet' },
      { hreflang: 'x-default', path: '/tg/yas/internet' },
    ]);
    expect(seo.image).toMatch(/^\/og\/en-tg-yas-internet\.png\?v=/);
  });

  it('gives every indexed page its own share image', () => {
    const slugs = shareCards(catalog).map((c) => c.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain('tg-yas-internet');
    expect(slugs).toContain('en-tg-yas-internet');
  });

  it('points each section page to a rendered image', () => {
    if (!togo) throw new Error('tg missing');
    const slugs = new Set(shareCards(catalog).map((c) => c.slug));

    for (const operator of togo.operators) {
      for (const section of SECTIONS) {
        const slug = /^\/og\/([a-z-]+)\.png\?v=\w+$/.exec(sectionSeo(togo, operator, section, 'fr').image)?.[1];
        expect(slug && slugs.has(slug)).toBe(true);
      }
    }
  });
});
