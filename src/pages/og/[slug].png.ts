import type { APIRoute } from 'astro';

import { loadCatalog } from '../../lib/catalog';
import { shareCards } from '../../lib/seo';
import type { ShareCard } from '../../lib/seo-types';
import { renderShareImage } from '../../lib/share-image';

/** Share images are rendered once, at build time. Visitors never download them; link previews and search engines do. */
export function getStaticPaths() {
  return shareCards(loadCatalog()).map((card) => ({ params: { slug: card.slug }, props: { card } }));
}

export const GET: APIRoute = async ({ props, site }) => {
  if (!site) throw new Error('astro.config: `site` is required for share images');
  const png = await renderShareImage((props as { card: ShareCard }).card, site.host);

  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
