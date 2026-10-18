import { describe, expect, it } from 'vitest';

import { detectLang, resolveLang } from '../src/i18n/detect';
import { en } from '../src/i18n/en';
import { fill, plural } from '../src/i18n/format-message';
import { fr } from '../src/i18n/fr';
import { countryFromPath, localePath, splitLang, switchLang } from '../src/i18n/paths';

/** Every leaf of a dictionary as "path → text"; list items count as leaves too. */
function leaves(node: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof node === 'string') return out.set(prefix, node);
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    for (const [path, text] of leaves(value, prefix ? `${prefix}.${key}` : key)) out.set(path, text);
  }

  return out;
}

const placeholders = (text: string): string[] => [...text.matchAll(/\{([a-z]+)\}/gi)].map((m) => m[1] ?? '').sort();

describe('dictionaries', () => {
  const frLeaves = leaves(fr);
  const enLeaves = leaves(en);

  it('have the same keys', () => {
    expect([...enLeaves.keys()].sort()).toEqual([...frLeaves.keys()].sort());
  });

  it('have no empty text and keep the same placeholders', () => {
    for (const [path, text] of frLeaves) {
      const translated = enLeaves.get(path) ?? '';
      expect(translated.trim(), path).not.toBe('');
      expect(placeholders(translated), path).toEqual(placeholders(text));
    }
  });
});

describe('paths', () => {
  it('keeps French at the current URLs and prefixes English', () => {
    expect(localePath('fr', '/tg/yas/internet')).toBe('/tg/yas/internet');
    expect(localePath('en', '/tg/yas/internet')).toBe('/en/tg/yas/internet');
    expect(localePath('en', '/')).toBe('/');
  });

  it('splits and switches the language of a path', () => {
    expect(splitLang('/en/tg/recherche')).toEqual({ lang: 'en', path: '/tg/recherche' });
    expect(splitLang('/en')).toEqual({ lang: 'en', path: '/' });
    expect(splitLang('/tg')).toEqual({ lang: 'fr', path: '/tg' });
    expect(switchLang('/tg/reglages', 'en')).toBe('/en/tg/reglages');
    expect(switchLang('/en/tg/reglages', 'fr')).toBe('/tg/reglages');
  });

  it('finds the country with or without a language prefix', () => {
    expect(countryFromPath('/tg/yas/internet')).toBe('tg');
    expect(countryFromPath('/en/tg/yas/internet')).toBe('tg');
    expect(countryFromPath('/')).toBe('');
  });
});

describe('language detection', () => {
  it('takes the first browser language Telko speaks, English otherwise', () => {
    expect(detectLang(['fr-FR', 'en'])).toBe('fr');
    expect(detectLang(['en-US', 'fr'])).toBe('en');
    expect(detectLang(['de-DE', 'fr-CA'])).toBe('fr');
    expect(detectLang(['pt-BR', 'sw'])).toBe('en');
    expect(detectLang([])).toBe('en');
  });

  it('prefers a saved choice and keeps earlier visitors in French', () => {
    expect(resolveLang('en', true, ['fr'])).toBe('en');
    expect(resolveLang(null, true, ['en-US'])).toBe('fr');
    expect(resolveLang(null, false, ['en-US'])).toBe('en');
    expect(resolveLang('xx', false, ['fr'])).toBe('fr');
  });
});

describe('message helpers', () => {
  it('fills placeholders and applies each language plural rules', () => {
    expect(fill('Étape {n} sur {total}', { n: 2, total: 4 })).toBe('Étape 2 sur 4');
    expect(plural('fr', 0, fr.client.search.results)).toBe('0 résultat');
    expect(plural('fr', 2, fr.client.search.results)).toBe('2 résultats');
    expect(plural('en', 0, en.client.search.results)).toBe('0 results');
    expect(plural('en', 1, en.client.search.results)).toBe('1 result');
  });
});
