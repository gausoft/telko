import { entriesByIds } from '../db/catalog-store';
import type { EntryRow } from '../db/db-types';
import { usageFor } from '../db/usage-store';
import { encodeUssd } from '../lib/dial';
import { rankHabits } from '../lib/habits';

/** Lucide "history", constant markup. */
const HISTORY_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>';

/**
 * Puts the codes this device uses most at the front of each operator's shortcuts.
 * A habit that is already an editorial shortcut moves forward instead of appearing twice.
 */
export async function showHabits(country: string): Promise<void> {
  const lists = Array.from(document.querySelectorAll<HTMLElement>('[data-habits]'));

  for (const list of lists) {
    const operator = list.dataset['habits'] ?? '';
    const ids = rankHabits(await usageFor(country, operator), Date.now());
    const entries = new Map((await entriesByIds(ids)).map((e) => [e.id, e]));

    for (const id of [...ids].reverse()) {
      const existing = list.querySelector<HTMLElement>(`[data-entry="${CSS.escape(id)}"]`);
      const entry = entries.get(id);
      const chip = existing ?? (entry ? habitChip(entry) : null);
      if (!chip) continue;

      chip.classList.add('chip-habit');
      list.prepend(chip);
    }
  }
}

function habitChip(entry: EntryRow): HTMLElement {
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

  const icon = document.createElement('span');
  icon.className = 'chip-icon';
  icon.innerHTML = HISTORY_ICON;
  const label = document.createElement('span');
  label.className = 'chip-label';
  label.textContent = entry.name;
  chip.append(icon, label);

  return chip;
}
