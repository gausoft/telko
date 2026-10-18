import type { OfflinePack } from '../db/db-types';
import type { Lang } from '../i18n/i18n-types';
import { localePath } from '../i18n/paths';
import type { CountryCatalog } from './catalog-types';
import { fingerprint } from './hash';
import type { Operator } from './schema';
import { SECTIONS } from './sections';

/**
 * Everything a device needs to work offline for one country in one language, split by operator so
 * only chosen operators are fetched. `data` is already in `lang`; `stamp` changes on every build.
 */
export function offlinePack(data: CountryCatalog, lang: Lang, stamp: string): OfflinePack {
  const code = data.country.code;
  const page = (path: string): string => localePath(lang, path);
  const entries = data.entries.filter((e) => e.provenance.status !== 'discontinued');
  const hash = fingerprint(JSON.stringify({ entries, operators: data.operators, fees: data.fees }));

  return {
    version: `${hash}-${stamp}`,
    country: code,
    lang,
    operators: data.operators.map((o) => o.id),
    pages: {
      // Brand images of every operator are shared: the operator switcher always shows them all.
      shared: [page(`/${code}`), page(`/${code}/recherche`), page(`/${code}/reglages`), ...data.operators.flatMap(brandImages)],
      byOperator: Object.fromEntries(data.operators.map((o) => [o.id, SECTIONS.map((s) => page(`/${code}/${o.id}/${s.id}`))])),
    },
    entries,
  };
}

function brandImages(operator: Operator): string[] {
  return [operator.logo, operator.mobile_money?.logo].filter((l): l is string => !!l).map((l) => `/brands/${l}`);
}
