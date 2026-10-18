import { SOURCE_LANG, type Lang } from './i18n-types';

/** "/tg/yas/internet" in French, "/en/tg/yas/internet" in English. The splash "/" picks the language itself. */
export function localePath(lang: Lang, path: string): string {
  if (lang === SOURCE_LANG || path === '/') return path;

  return `/${lang}${path}`;
}

/** The language of a page and its path without the language prefix. */
export function splitLang(pathname: string): { lang: Lang; path: string } {
  if (pathname === '/en' || pathname.startsWith('/en/')) return { lang: 'en', path: pathname.slice(3) || '/' };

  return { lang: SOURCE_LANG, path: pathname };
}

export function pageLang(url: URL): Lang {
  return splitLang(url.pathname).lang;
}

/** The same page in another language. */
export function switchLang(pathname: string, lang: Lang): string {
  return localePath(lang, splitLang(pathname).path);
}

/** Country code of a page such as "/en/tg/yas/internet", or "" outside country pages. */
export function countryFromPath(pathname: string): string {
  return splitLang(pathname).path.split('/')[1] ?? '';
}
