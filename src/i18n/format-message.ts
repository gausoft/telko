import type { Lang, Plural } from './i18n-types';

/** Replaces each {name} with its value; an unknown placeholder stays visible so it is caught in review. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{([a-z]+)\}/gi, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** French counts 0 and 1 as singular, English only 1: the language's own rules decide. */
export function plural(lang: Lang, n: number, forms: Plural): string {
  const form = new Intl.PluralRules(lang).select(n) === 'one' ? forms.one : forms.other;

  return fill(form, { n });
}
