import { describe, expect, it } from 'vitest';

import { LANGS } from '../src/i18n/i18n-types';
import { loadCatalog } from '../src/lib/catalog';
import { countryPaths, searchPaths } from '../src/lib/routes';

const catalog = loadCatalog();

describe('country pages', () => {
  it('gives every country a path, live or soon', () => {
    for (const lang of LANGS) {
      const codes = countryPaths(lang).map((p) => p.params.country);

      expect([...codes].sort()).toEqual(catalog.countries.map((c) => c.code).sort());
    }
  });

  it('builds the live countries as home pages and the others as soon pages', () => {
    for (const lang of LANGS) {
      for (const path of countryPaths(lang)) {
        const live = catalog.countries.find((c) => c.code === path.params.country)?.status === 'live';

        expect(path.props.view).toBe(live ? 'home' : 'soon');
      }
    }
  });

  it('lists the operators already sourced for a country still soon', () => {
    const benin = countryPaths('fr').find((p) => p.params.country === 'bj');

    expect(benin?.props.view).toBe('soon');
    if (benin?.props.view !== 'soon') throw new Error('bj missing');

    expect(benin.props.operators.length).toBeGreaterThan(0);
    expect(benin.props.operators.every((o) => o.provenance.sources.length > 0)).toBe(true);
  });

  it('keeps the search payload free of the country list, which the page already has', () => {
    const payload = JSON.parse(searchPaths('fr')[0]?.props.payload ?? '{}') as Record<string, unknown>;

    expect(Object.keys(payload).sort()).toEqual(['brands', 'docs']);
  });
});
