import { describe, expect, it } from 'vitest';

import { loadCatalog } from '../src/lib/catalog';
import { missingTranslations } from '../src/lib/translation-coverage';

const catalog = loadCatalog();

describe('English data', () => {
  it('translates every French text of the dataset', () => {
    expect(missingTranslations(catalog)).toEqual([]);
  });

  it('keeps the "condition: amount" shape of fee labels, so fee tables read the same', () => {
    const fees = [...catalog.byCountry.values()].flatMap((c) => c.fees);
    const broken = fees.filter((f) => f.label.includes(':') !== (f.en?.label ?? f.label).includes(':')).map((f) => f.id);

    expect(broken).toEqual([]);
  });
});
