import { LANGS, type Lang } from './i18n-types';

export function isLang(value: string | null | undefined): value is Lang {
  return LANGS.some((l) => l === value);
}

/** The first browser language Telko speaks wins; any other browser gets English. */
export function detectLang(languages: readonly string[]): Lang {
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0];
    if (isLang(base)) return base;
  }

  return 'en';
}

/** A saved choice wins. Visitors onboarded before languages existed did it in French and stay there. */
export function resolveLang(pref: string | null, onboarded: boolean, languages: readonly string[]): Lang {
  if (isLang(pref)) return pref;
  if (onboarded) return 'fr';

  return detectLang(languages);
}
