import { fill } from '../i18n/format-message';
import type { Lang } from '../i18n/i18n-types';
import { messages } from '../i18n/messages';
import { localePath } from '../i18n/paths';
import type { CountryCatalog } from './catalog-types';
import { toFeeRows } from './fee-rows';
import { quoteFor } from './fee-lookup';
import { formatAmount } from './format';
import type { Operator } from './schema';
import { sectionImage } from './seo';
import { SECTIONS } from './sections';
import type { Alternate, PageSeo } from './seo-types';
import { LANGS } from '../i18n/i18n-types';

/** Search result of the fee page of one amount: the answer for each service goes in the description. */
export function feeAmountSeo(data: CountryCatalog, operator: Operator, amount: number, lang: Lang): PageSeo {
  const m = messages(lang);
  const money = operator.mobile_money ?? operator;
  const code = data.country.code;
  const path = `/${code}/${operator.id}/frais/${amount}`;
  const shown = formatAmount(amount, data.country.amount_label);
  const heading = fill(m.fees.calc.pageHeading, { amount: shown, money: money.short_name });
  const section = SECTIONS.find((s) => s.id === 'frais');
  if (!section) throw new Error('the fees section is missing');

  return {
    lang,
    title: `${fill(m.fees.calc.pageTitle, { amount: shown, money: money.short_name })} · ${data.country.name} · Telko`,
    description: description(data, amount, lang),
    path: localePath(lang, path),
    image: sectionImage(data, operator, section, lang),
    imageAlt: heading,
    noindex: false,
    crumbs: [
      { name: `Telko ${data.country.name}`, path: localePath(lang, `/${code}`) },
      { name: m.sections.frais, path: localePath(lang, `/${code}/${operator.id}/frais`) },
      { name: shown, path: localePath(lang, path) },
    ],
    alternates: alternates(path),
  };
}

/** "Withdrawal: Mixx 1 000 F, Moov Money 1 000 F": the published withdrawal fee of each service. */
function description(data: CountryCatalog, amount: number, lang: Lang): string {
  const m = messages(lang);
  const decimal = lang === 'fr' ? ',' : '.';
  const rows = toFeeRows(data.fees, m.fees, decimal);
  const parts = data.operators.flatMap((o) => {
    const found = quoteFor(rows, o.id, amount, ['withdrawal']).groups[0]?.rows ?? [];

    return found.length > 0 ? [`${(o.mobile_money ?? o).short_name} ${found.map((r) => r.amount).join(' / ')}`] : [];
  });
  const lead = `${m.fees.operations.withdrawal} ${formatAmount(amount, data.country.amount_label)}`;

  return parts.length > 0 ? `${lead} : ${parts.join(', ')}.` : lead;
}

function alternates(path: string): Alternate[] {
  return [...LANGS.map((l) => ({ hreflang: l, path: localePath(l, path) })), { hreflang: 'x-default' as const, path }];
}
