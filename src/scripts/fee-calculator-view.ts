import type { FeeCalculatorData } from '../lib/fee-calculator-types';
import type { FeeQuote } from '../lib/fee-lookup-types';
import { formatAmount } from '../lib/format';

export interface NamedQuote {
  name: string;
  quote: FeeQuote;
}

/** Draws the fees of each operator for one amount. Text only: nothing typed or published is ever read as HTML. */
export function renderQuotes(target: HTMLElement, quotes: NamedQuote[], amount: number, data: FeeCalculatorData): void {
  const title = el('p', 'fq-for', data.text.resultFor.replace('{amount}', formatAmount(amount, data.amountLabel)));
  const cards = quotes.map((entry) => card(entry, data));

  target.replaceChildren(title, ...cards);
}

function card(entry: NamedQuote, data: FeeCalculatorData): HTMLElement {
  const section = el('section', 'fq-card');
  section.append(el('h3', '', entry.name));

  if (entry.quote.groups.length === 0) section.append(el('p', 'fq-none', data.text.noBand));

  for (const { operation, rows } of entry.quote.groups) {
    const list = el('dl', '');
    list.append(el('dt', 'fq-op', data.operations[operation] ?? operation));

    for (const row of rows) {
      const line = el('div', 'fq-line');
      line.append(el('dd', '', row.condition), el('dd', 'fq-fee', row.amount));
      list.append(line);
    }

    section.append(list);
  }

  return section;
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;

  return node;
}
