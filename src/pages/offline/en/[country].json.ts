import type { APIRoute } from 'astro';

import { loadCatalog } from '../../../lib/catalog';
import type { CountryCatalog } from '../../../lib/catalog-types';
import { localizeCatalog } from '../../../lib/localize';
import { offlinePack } from '../../../lib/offline-pack';

/** Changes on every build, so pages are fetched again when the site changes, not only the data. */
const BUILD_STAMP = String(Date.now());

export function getStaticPaths() {
  return [...localizeCatalog(loadCatalog(), 'en').byCountry.values()].map((data) => ({ params: { country: data.country.code }, props: { data } }));
}

export const GET: APIRoute = ({ props }) => {
  const pack = offlinePack((props as { data: CountryCatalog }).data, 'en', BUILD_STAMP);

  return new Response(JSON.stringify(pack), { headers: { 'Content-Type': 'application/json' } });
};
