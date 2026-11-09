import type { Lang } from '../i18n/i18n-types';
import { loadCatalog } from './catalog';
import type { FeeAmountProps } from '../views/view-types';
import { FEE_PAGE_AMOUNTS } from './fee-lookup';
import { localizeCatalog } from './localize';

/** One page per operator and per searched amount, for operators that publish fees. */
export function feeAmountPaths(lang: Lang): { params: { country: string; operator: string; amount: string }; props: FeeAmountProps }[] {
  const catalog = localizeCatalog(loadCatalog(), lang);

  return [...catalog.byCountry.values()].flatMap((data) =>
    data.operators
      .filter((operator) => data.fees.some((fee) => fee.operator === operator.id))
      .flatMap((operator) =>
        FEE_PAGE_AMOUNTS.map((amount) => ({
          params: { country: data.country.code, operator: operator.id, amount: String(amount) },
          props: { data, operator, amount, catalog },
        })),
      ),
  );
}
