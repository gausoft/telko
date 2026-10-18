import type { APIRoute } from 'astro';

import type { OfflinePack } from '../../db/db-types';
import { loadCatalog } from '../../lib/catalog';
import { fingerprint } from '../../lib/hash';
import type { CountryCatalog } from '../../lib/catalog-types';
import type { Operator } from '../../lib/schema';
import { SECTIONS } from '../../lib/sections';

/** Changes on every build, so pages are fetched again when the site changes, not only the data. */
const BUILD_STAMP = String(Date.now());

export function getStaticPaths() {
  return [...loadCatalog().byCountry.values()].map((data) => ({ params: { country: data.country.code }, props: { data } }));
}

export const GET: APIRoute = ({ props }) => {
  const pack = offlinePack((props as { data: CountryCatalog }).data);

  return new Response(JSON.stringify(pack), { headers: { 'Content-Type': 'application/json' } });
};

/** Everything a device needs to work offline for one country, split by operator so only chosen operators are fetched. */
function offlinePack(data: CountryCatalog): OfflinePack {
  const code = data.country.code;
  const entries = data.entries.filter((e) => e.provenance.status !== 'discontinued');
  const hash = fingerprint(JSON.stringify({ entries, operators: data.operators, fees: data.fees }));

  return {
    version: `${hash}-${BUILD_STAMP}`,
    country: code,
    operators: data.operators.map((o) => o.id),
    pages: {
      // Brand images of every operator are shared: the operator switcher always shows them all.
      shared: [`/${code}`, `/${code}/recherche`, `/${code}/reglages`, ...data.operators.flatMap(brandImages)],
      byOperator: Object.fromEntries(data.operators.map((o) => [o.id, SECTIONS.map((s) => `/${code}/${o.id}/${s.id}`)])),
    },
    entries,
  };
}

function brandImages(operator: Operator): string[] {
  return [operator.logo, operator.mobile_money?.logo].filter((l): l is string => !!l).map((l) => `/brands/${l}`);
}
