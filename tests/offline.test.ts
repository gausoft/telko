import { describe, expect, it } from 'vitest';

import { loadCatalog } from '../src/lib/catalog';
import { localizeCatalog } from '../src/lib/localize';
import { offlinePack } from '../src/lib/offline-pack';
import { filesFor, keyLang, readyKey } from '../src/scripts/offline-sync';

const pack = {
  pages: {
    shared: ['/tg', '/tg/recherche', '/brands/yas.svg'],
    byOperator: { yas: ['/tg/yas/internet'], moov: ['/tg/moov/internet'] },
  },
};

describe('offline files', () => {
  it('downloads the shared files and the chosen operators only', () => {
    expect(filesFor(pack, ['moov'])).toEqual(['/tg', '/tg/recherche', '/brands/yas.svg', '/tg/moov/internet']);
  });

  it('ignores an unknown operator', () => {
    expect(filesFor(pack, ['orange'])).toEqual(pack.pages.shared);
  });
});

describe('offline packs per language', () => {
  const english = localizeCatalog(loadCatalog(), 'en').byCountry.get('tg');
  if (!english) throw new Error('tg missing');
  const pack = offlinePack(english, 'en', 'stamp');

  it('lists the English pages under /en', () => {
    expect(pack.lang).toBe('en');
    expect(pack.pages.shared).toContain('/en/tg');
    expect(pack.pages.shared).toContain('/en/tg/recherche');
    expect(pack.pages.byOperator['yas']).toContain('/en/tg/yas/internet');
    expect(pack.pages.shared).toContain('/brands/yas.svg');
  });

  it('keys the saved catalog by language, so switching language downloads again', () => {
    const key = readyKey('v1', 'fr', ['yas', 'moov']);

    expect(key).toBe('v1|fr|moov,yas');
    expect(key).not.toBe(readyKey('v1', 'en', ['moov', 'yas']));
    expect(keyLang(key)).toBe('fr');
    expect(keyLang(null)).toBeNull();
  });
});
