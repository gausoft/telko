import type { APIRoute } from 'astro';

import { loadCatalog } from '../lib/catalog';
import { SECTIONS } from '../lib/sections';

/** Pages worth a search result: each country home and each section page. App screens are left out (noindex). */
export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('astro.config: `site` is required for the sitemap');

  const paths = [...loadCatalog().byCountry.values()].flatMap((data) => [
    `/${data.country.code}`,
    ...data.operators.flatMap((o) => SECTIONS.map((s) => `/${data.country.code}/${o.id}/${s.id}`)),
  ]);
  const urls = paths.map((path) => `  <url><loc>${escapeXml(new URL(path, site).href)}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
