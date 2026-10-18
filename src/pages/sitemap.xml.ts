import type { APIRoute } from 'astro';

import { LANGS } from '../i18n/i18n-types';
import { localePath } from '../i18n/paths';
import { loadCatalog } from '../lib/catalog';
import { SECTIONS } from '../lib/sections';

/**
 * Pages worth a search result: each country home and each section page, in every language.
 * Each URL lists its other language versions; French, the source, is the default.
 * App screens are left out (noindex).
 */
export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('astro.config: `site` is required for the sitemap');

  const paths = [...loadCatalog().byCountry.values()].flatMap((data) => [
    `/${data.country.code}`,
    ...data.operators.flatMap((o) => SECTIONS.map((s) => `/${data.country.code}/${o.id}/${s.id}`)),
  ]);
  const href = (path: string): string => escapeXml(new URL(path, site).href);
  const alternates = (path: string): string =>
    [...LANGS.map((l) => [l, localePath(l, path)] as const), ['x-default', path] as const]
      .map(([lang, p]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${href(p)}"/>`)
      .join('');
  const urls = paths.flatMap((path) => LANGS.map((lang) => `  <url><loc>${href(localePath(lang, path))}</loc>${alternates(path)}</url>`)).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
