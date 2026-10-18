import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import satori from 'satori';
import sharp from 'sharp';

import type { ShareCard } from './seo-types';

const WIDTH = 1200;
const HEIGHT = 630;
const ACTION = '#4B3BFF';
const ON_ACTION = '#FFFFFF';
const SOFT = '#DCD8FF';
const DOT = '#B8B0FF';
const PROMO = '#E0195F';
/** Lucide "flame", drawn in white for the selling line. */
const FLAME =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/></svg>';
const FONT_DIR = 'node_modules/@fontsource/bricolage-grotesque/files';

/** A satori element: the same shape as a React element, written without JSX. */
interface Node {
  type: string;
  props: Record<string, unknown>;
}

type SatoriInput = Parameters<typeof satori>[0];

/** Renders one 1200 × 630 PNG for link previews (WhatsApp, Telegram, search engines). */
export async function renderShareImage(card: ShareCard, host: string): Promise<Buffer> {
  const svg = await satori(cardLayout(card, host) as unknown as SatoriInput, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Bricolage Grotesque', data: font('bricolage-grotesque-latin-500-normal.woff'), weight: 500, style: 'normal' },
      { name: 'Bricolage Grotesque', data: font('bricolage-grotesque-latin-800-normal.woff'), weight: 800, style: 'normal' },
    ],
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}

function cardLayout(card: ShareCard, host: string): Node {
  return el(
    'div',
    {
      width: WIDTH,
      height: HEIGHT,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 72,
      background: ACTION,
      color: ON_ACTION,
      fontFamily: 'Bricolage Grotesque',
    },
    [
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [wordmark(), logoRow(card.logos)]),
      el('div', { display: 'flex', flexDirection: 'column', gap: 16 }, [
        el('div', { display: 'flex', fontSize: 30, fontWeight: 500, color: SOFT }, [card.eyebrow]),
        el('div', { display: 'flex', fontSize: 80, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.03em', maxWidth: 1000 }, [card.title]),
      ]),
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
        card.highlight ? highlightPill(card.highlight) : el('div', { display: 'flex' }, []),
        el('div', { display: 'flex', fontSize: 28, fontWeight: 500, color: SOFT }, [host]),
      ]),
    ],
  );
}

/** "telk" followed by the round dot standing for the "o", as on the splash screen. */
function wordmark(): Node {
  return el('div', { display: 'flex', alignItems: 'center', fontSize: 64, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }, [
    'telk',
    el('div', { width: 34, height: 34, marginTop: 16, marginLeft: 6, borderRadius: 17, background: DOT }, []),
  ]);
}

function logoRow(logos: string[]): Node {
  return el(
    'div',
    { display: 'flex', gap: 16 },
    logos.map((logo) =>
      el('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 104, height: 104, borderRadius: 52, background: '#FFFFFF' }, [
        el('img', { width: 68, height: 68, objectFit: 'contain' }, [], { src: dataUri(join('public/brands', logo)) }),
      ]),
    ),
  );
}

function highlightPill(text: string): Node {
  return el(
    'div',
    { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 30px 14px 22px', borderRadius: 999, background: PROMO, fontSize: 40, fontWeight: 800 },
    [el('img', { width: 40, height: 40 }, [], { src: `data:image/svg+xml;base64,${Buffer.from(FLAME).toString('base64')}` }), text],
  );
}

function el(type: string, style: Record<string, unknown>, children: (Node | string)[], attrs: Record<string, unknown> = {}): Node {
  const display = type === 'div' && style['display'] === undefined ? { display: 'flex' } : {};

  return { type, props: { ...attrs, style: { ...display, ...style }, children } };
}

function font(file: string): Buffer {
  return readFileSync(join(process.cwd(), FONT_DIR, file));
}

function dataUri(path: string): string {
  const type = path.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

  return `data:${type};base64,${readFileSync(join(process.cwd(), path)).toString('base64')}`;
}
