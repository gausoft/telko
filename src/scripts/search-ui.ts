import type { BuilderPayload } from '../lib/builder-types';
import { search } from '../lib/search';
import type { SearchDoc, SearchHit } from '../lib/search-types';
import { codeTokens } from '../lib/ussd-flow';
import { fill as fillText, plural } from '../i18n/format-message';
import { codeLineElement } from './code-line';
import { pageLangOf, t } from './i18n-client';
import type { SearchBrand, SearchPayload } from './search-ui-types';

const PENCIL =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';

export function startSearch(): void {
  const payload = readPayload();
  const input = document.querySelector<HTMLInputElement>('#q');
  const page = document.querySelector<HTMLElement>('[data-country]');
  if (!payload || !input || !page) return;

  const country = page.dataset['country'] ?? '';
  const update = (): void => paint(payload, search(payload.docs, input.value, country, pageLangOf()));
  bindControls(input, update);
}

/** Field, clear button and suggestion chips all end in the same refresh. */
function bindControls(input: HTMLInputElement, update: () => void): void {
  const clear = document.querySelector<HTMLButtonElement>('[data-clear]');
  const refresh = (): void => {
    if (clear) clear.hidden = input.value.length === 0;
    update();
  };

  const initial = new URLSearchParams(window.location.search).get('q');
  if (initial) input.value = initial;
  input.addEventListener('input', refresh);
  clear?.addEventListener('click', () => {
    input.value = '';
    input.focus();
    refresh();
  });
  document.querySelectorAll<HTMLButtonElement>('[data-suggest]').forEach((chip) =>
    chip.addEventListener('click', () => {
      input.value = chip.dataset['suggest'] ?? '';
      refresh();
    }),
  );
  refresh();
}

function readPayload(): SearchPayload | null {
  const raw = document.querySelector('#search-data')?.textContent;
  if (!raw) return null;

  return JSON.parse(raw) as SearchPayload;
}

function readBuilder(): BuilderPayload['entries'] {
  const raw = document.querySelector('#code-builder-data')?.textContent;

  return raw ? (JSON.parse(raw) as BuilderPayload).entries : {};
}

const builderEntries = readBuilder();

function paint(payload: SearchPayload, hits: SearchHit[]): void {
  const local = hits.filter((h) => h.local);
  const other = hits.filter((h) => !h.local);
  const query = document.querySelector<HTMLInputElement>('#q')?.value.trim() ?? '';

  fill('[data-local]', local, payload);
  fill('[data-other]', other, payload);
  toggle('[data-local-title]', local.length > 0);
  toggle('[data-other-title]', other.length > 0);
  toggle('[data-hint]', query.length === 0);
  toggle('[data-empty]', query.length > 0 && hits.length === 0);

  const count = document.querySelector<HTMLElement>('[data-count]');
  if (count) count.textContent = query.length === 0 ? '' : plural(pageLangOf(), hits.length, t().search.results);
}

function fill(selector: string, hits: SearchHit[], payload: SearchPayload): void {
  const box = document.querySelector<HTMLElement>(selector);
  if (!box) return;

  box.replaceChildren(...hits.map((h) => row(h.doc, payload.brands[`${h.doc.country}:${h.doc.operator}`])));
}

function toggle(selector: string, visible: boolean): void {
  const el = document.querySelector<HTMLElement>(selector);
  if (el) el.hidden = !visible;
}

function row(doc: SearchDoc, brand: SearchBrand | undefined): HTMLElement {
  const toBuild = doc.dialable ? undefined : builderEntries[doc.id];
  const el = document.createElement(doc.dialable ? 'a' : 'button');
  el.className = 'search-row';
  if (el instanceof HTMLAnchorElement) {
    el.href = `tel:${doc.code.replace(/#/g, '%23')}`;
    el.dataset['dial'] = doc.code;
    el.dataset['label'] = doc.title;
    el.dataset['operator'] = doc.operator;
    el.dataset['entry'] = doc.id;
    el.setAttribute('aria-label', fillText(t().search.dialAria, { code: doc.code, label: doc.title }));
  } else if (el instanceof HTMLButtonElement) {
    el.type = 'button';
    if (toBuild) el.dataset['build'] = toBuild.id;
    el.setAttribute('aria-label', fillText(t().search.completeAria, { title: doc.title }));
  }

  el.append(mark(brand), text(doc));
  el.append(doc.dialable ? callIcon() : editIcon());

  return el;
}

function mark(brand: SearchBrand | undefined): HTMLElement {
  const span = document.createElement('span');
  span.className = 'search-mark';
  if (!brand) return span;

  if (brand.logo) {
    const img = document.createElement('img');
    img.src = `/brands/${brand.logo}`;
    img.alt = brand.name;
    span.classList.add('search-mark-logo');
    span.append(img);
  } else {
    span.textContent = brand.badge.label;
    span.style.background = brand.badge.background;
    span.style.color = brand.badge.foreground;
  }

  return span;
}

function text(doc: SearchDoc): HTMLElement {
  const body = document.createElement('span');
  body.className = 'search-body';
  const title = document.createElement('span');
  title.className = 'search-title';
  title.textContent = doc.title;
  const sub = document.createElement('span');
  sub.className = 'search-sub';
  sub.textContent = doc.subtitle;
  const entry = builderEntries[doc.id];
  const code = entry ? codeLineElement(codeTokens(entry.ussd, t().flow.shorts)) : document.createElement('span');
  if (!entry) {
    code.className = 'search-code mono';
    code.textContent = doc.code;
  }
  body.append(title, sub, code);

  return body;
}

function callIcon(): HTMLElement {
  const span = document.createElement('span');
  span.className = 'search-call';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>';

  return span;
}

function editIcon(): HTMLElement {
  const span = callIcon();
  span.classList.add('search-edit');
  span.innerHTML = PENCIL;

  return span;
}
