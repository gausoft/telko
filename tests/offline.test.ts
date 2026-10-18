import { describe, expect, it } from 'vitest';

import { filesFor } from '../src/scripts/offline-sync';

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
