import { describe, expect, it } from 'vitest';

import { loadCatalog } from '../src/lib/catalog';
import { sectionSeo, shareCards } from '../src/lib/seo';
import { SECTIONS } from '../src/lib/sections';

const catalog = loadCatalog();
const togo = catalog.byCountry.get('tg');

describe('page SEO', () => {
  it('never announces an empty count', () => {
    if (!togo) throw new Error('tg missing');

    for (const operator of togo.operators) {
      for (const section of SECTIONS) {
        const seo = sectionSeo(togo, operator, section);
        expect(seo.description).not.toMatch(/\b0 (codes|forfaits|montants)/);
        expect(seo.description.length).toBeLessThanOrEqual(160);
      }
    }
  });

  it('gives every indexed page its own share image', () => {
    const slugs = shareCards(catalog).map((c) => c.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain('tg-yas-internet');
  });

  it('points each section page to a rendered image', () => {
    if (!togo) throw new Error('tg missing');
    const slugs = new Set(shareCards(catalog).map((c) => c.slug));

    for (const operator of togo.operators) {
      for (const section of SECTIONS) {
        const slug = /^\/og\/([a-z-]+)\.png\?v=\w+$/.exec(sectionSeo(togo, operator, section).image)?.[1];
        expect(slug && slugs.has(slug)).toBe(true);
      }
    }
  });
});
