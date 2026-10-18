export interface ChoiceListHandle {
  selected(): string[];
  set(ids: string[]): void;
}

/**
 * Wires a ChoiceList: single choice by default, several when the list has
 * data-multiple (a multiple list never ends up empty).
 */
export function bindChoiceList(list: HTMLElement, onChange?: (ids: string[]) => void): ChoiceListHandle {
  const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('[data-choice]'));
  const multiple = list.dataset['multiple'] === 'true';
  const idOf = (b: HTMLButtonElement): string => b.dataset['choice'] ?? '';
  const isOn = (b: HTMLButtonElement): boolean => b.getAttribute('aria-pressed') === 'true';

  const handle: ChoiceListHandle = {
    selected: () => buttons.filter(isOn).map(idOf),
    set: (ids) => buttons.forEach((b) => b.setAttribute('aria-pressed', String(ids.includes(idOf(b))))),
  };

  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      if (!multiple) handle.set([idOf(button)]);
      else if (!isOn(button) || handle.selected().length > 1) button.setAttribute('aria-pressed', String(!isOn(button)));
      onChange?.(handle.selected());
    }),
  );

  return handle;
}
