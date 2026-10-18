import { entriesByIds } from '../db/catalog-store';
import type { EntryRow } from '../db/db-types';
import { usageFor } from '../db/usage-store';
import { encodeUssd } from '../lib/dial';
import { rankHabits } from '../lib/habits';
import { brandMarkElement } from './brand-mark';
import type { OperatorBrands } from '../lib/brand-types';

/**
 * Puts the codes this device uses most at the front of each operator's shortcuts.
 * A habit that is already an editorial shortcut moves forward instead of appearing twice.
 */
export async function showHabits(country: string): Promise<void> {
  const lists = Array.from(document.querySelectorAll<HTMLElement>('[data-habits]'));
  const brands = readBrands();

  for (const list of lists) {
    const operator = list.dataset['habits'] ?? '';
    const ids = rankHabits(await usageFor(country, operator), Date.now());
    const entries = new Map((await entriesByIds(ids)).map((e) => [e.id, e]));

    for (const id of [...ids].reverse()) {
      const existing = list.querySelector<HTMLElement>(`[data-entry="${CSS.escape(id)}"]`);
      const entry = entries.get(id);
      const chip = existing ?? (entry ? habitChip(entry, brands[entry.operator]) : null);
      if (!chip) continue;

      chip.classList.add('chip-habit');
      list.prepend(chip);
    }
  }
}

function readBrands(): Record<string, OperatorBrands> {
  const raw = document.querySelector('#brand-data')?.textContent;

  return raw ? (JSON.parse(raw) as Record<string, OperatorBrands>) : {};
}

function habitChip(entry: EntryRow, brands: OperatorBrands | undefined): HTMLElement {
  const dialable = entry.ussd.params.length === 0;
  const chip = document.createElement(dialable ? 'a' : 'button');
  chip.className = 'chip';
  chip.dataset['entry'] = entry.id;
  chip.dataset['operator'] = entry.operator;

  if (chip instanceof HTMLAnchorElement) {
    chip.href = `tel:${encodeUssd(entry.ussd.template)}`;
    chip.dataset['dial'] = entry.ussd.template;
    chip.dataset['label'] = entry.name;
  } else if (chip instanceof HTMLButtonElement) {
    chip.type = 'button';
    chip.dataset['build'] = entry.id;
  }

  const brand = entry.category === 'mobile-money' ? (brands?.money ?? brands?.operator) : brands?.operator;
  const label = document.createElement('span');
  label.className = 'chip-label';
  label.textContent = entry.name;
  if (brand) chip.append(brandMarkElement(brand, 26));
  chip.append(label);

  return chip;
}
