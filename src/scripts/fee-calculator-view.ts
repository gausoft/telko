import type { FeeCalculatorData } from '../lib/fee-calculator-types';
import { splitQuote } from '../lib/fee-lookup';
import type { FeeQuote } from '../lib/fee-lookup-types';
import { formatAmount } from '../lib/format';

export interface NamedQuote {
  name: string;
  badge: FeeCalculatorData['names'][number]['badge'];
  quote: FeeQuote;
}

const LONG_AMOUNT = 9;

/** Draws the answer of each service for one amount, then the rest folded away. Text only: nothing typed or published is ever read as HTML. */
export function renderQuotes(target: HTMLElement, quotes: NamedQuote[], amount: number, data: FeeCalculatorData): void {
  const title = el('p', 'fq-for', data.text.resultFor.replace('{amount}', formatAmount(amount, data.amountLabel)));
  const split = quotes.map((entry) => ({ entry, ...splitQuote(entry.quote) }));
  const cards = el('div', 'fq-cards');
  cards.append(...split.map(({ entry, head }) => card(entry, head, data)));

  const children: HTMLElement[] = [title, cards];
  const withRest = split.filter((item) => item.rest.length > 0);
  if (withRest.length > 0) children.push(more(withRest, data));

  target.replaceChildren(...children);
}

function card(entry: NamedQuote, head: FeeQuote['groups'][number] | null, data: FeeCalculatorData): HTMLElement {
  const section = el('section', 'fq-card');
  const who = el('h3', 'fq-who');
  const badge = el('span', 'fq-badge', entry.badge.label);
  badge.style.background = entry.badge.background;
  badge.style.color = entry.badge.foreground;
  who.append(badge, entry.name);
  section.append(who);

  if (head === null) section.append(el('p', 'fq-none', data.text.noBand));
  if (head === null) return section;

  section.append(el('p', 'fq-op', data.operations[head.operation] ?? head.operation));
  for (const row of head.rows) section.append(el('p', row.amount.length > LONG_AMOUNT ? 'fq-big fq-long' : 'fq-big', row.amount));

  return section;
}

function more(items: { entry: NamedQuote; rest: FeeQuote['groups'] }[], data: FeeCalculatorData): HTMLElement {
  const details = el('details', 'fq-more');
  details.append(el('summary', '', data.text.more));

  for (const { entry, rest } of items) {
    const block = el('section', 'fq-rest');
    block.append(el('h3', '', entry.name));

    for (const { operation, rows } of rest) {
      const group = el('div', 'fq-group');
      const list = el('ul', '');
      group.append(el('p', 'fq-op', data.operations[operation] ?? operation), list);

      for (const row of rows) {
        const line = el('li', 'fq-line');
        line.append(el('span', 'fq-cond', row.condition), el('span', 'fq-fee', row.amount));
        list.append(line);
      }

      block.append(group);
    }

    details.append(block);
  }

  return details;
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;

  return node;
}
