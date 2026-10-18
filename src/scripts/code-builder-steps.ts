import { encodeUssd } from '../lib/dial';
import { DEFAULT_PRESETS } from '../lib/ussd-flow';
import type { ReviewContext, StepContext, StepView } from './code-builder-types';

/** Lucide "lock", constant markup. */
const LOCK_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

/** Builds the panel for one step; the type of box decides the field and the keyboard. */
export function stepView(ctx: StepContext): StepView {
  if (ctx.step.type === 'phone') return phoneView(ctx);
  if (ctx.step.type === 'amount') return amountView(ctx);
  if (ctx.step.type === 'choice') return choiceView(ctx);

  return textView(ctx);
}

function phoneView(ctx: StepContext): StepView {
  const field = fieldShell(ctx);
  const country = el('button', 'cb-country');
  country.type = 'button';
  country.setAttribute('aria-label', `Pays : ${ctx.country.name}. Changer`);
  const flag = document.createElement('img');
  flag.src = `/flags/${ctx.country.code}.svg`;
  flag.alt = '';
  flag.width = 22;
  flag.height = 22;
  country.append(flag, text('span', `+${ctx.country.dialCode}`));
  country.addEventListener('click', ctx.onPickCountry);

  const input = inputFor(ctx, { type: 'tel', inputMode: 'tel', autocomplete: 'tel', placeholder: '9'.repeat(ctx.country.nationalLength).replace(/(\d{2})(?=\d)/g, '$1 ') });
  field.box.prepend(country);
  field.box.append(input);

  const mine = ctx.recipients.filter((r) => r.country === ctx.country.code);
  if (mine.length > 0) {
    field.element.append(
      chips(mine.map((r) => ({ label: r.number.replace(/(\d{2})(?=\d)/g, '$1 '), onClick: () => ctx.onPickRecipient(r) }))),
    );
  }

  return { element: field.element, focus: input, read: () => input.value };
}

function amountView(ctx: StepContext): StepView {
  const field = fieldShell(ctx);
  const input = inputFor(ctx, { type: 'text', inputMode: 'numeric', autocomplete: 'off', placeholder: '0' });
  field.box.append(input, text('span', 'F CFA', 'cb-suffix'));

  const presets = ctx.step.presets ?? DEFAULT_PRESETS;
  field.element.append(
    chips(
      presets.map((amount) => ({
        label: `${amount.toLocaleString('fr-FR')} F`,
        onClick: () => {
          input.value = String(amount);
          input.focus();
        },
      })),
    ),
  );

  return { element: field.element, focus: input, read: () => input.value };
}

function textView(ctx: StepContext): StepView {
  const field = fieldShell(ctx);
  const input = inputFor(ctx, { type: 'text', inputMode: ctx.step.numeric ? 'numeric' : 'text', autocomplete: 'off', placeholder: '' });
  if (ctx.step.length !== undefined) input.maxLength = ctx.step.length;
  field.box.append(input);

  return { element: field.element, focus: input, read: () => input.value };
}

function choiceView(ctx: StepContext): StepView {
  const panel = el('div', 'cb-step');
  panel.append(text('p', ctx.step.label, 'cb-label'));
  let value = ctx.raw;
  const list = el('div', 'cb-options');

  for (const option of ctx.step.options ?? []) {
    const button = el('button', 'cb-option');
    button.type = 'button';
    button.textContent = option.label;
    button.setAttribute('aria-pressed', String(option.value === value));
    button.addEventListener('click', () => {
      value = option.value;
      list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    });
    list.append(button);
  }
  panel.append(list);

  return { element: panel, focus: list.querySelector('button'), read: () => value };
}

/** Final screen: the code to dial. The secret code is never asked here; the operator asks for it. */
export function reviewView(ctx: ReviewContext): StepView {
  const panel = el('div', 'cb-step cb-review');
  if (ctx.built.needsSecret) {
    const note = el('p', 'cb-note');
    const lock = el('span', 'cb-lock');
    lock.innerHTML = LOCK_ICON;
    note.append(lock, text('span', 'Le réseau vous demandera votre code secret'));
    panel.append(note);
  }

  const dial = el('a', 'cb-primary');
  dial.href = `tel:${encodeUssd(ctx.built.code)}`;
  dial.textContent = 'Composer';
  dial.addEventListener('click', ctx.onDial);

  const copy = el('button', 'cb-secondary');
  copy.type = 'button';
  copy.textContent = 'Copier';
  copy.addEventListener('click', () => {
    void navigator.clipboard?.writeText(ctx.built.code).then(() => (copy.textContent = 'Copié'));
  });

  panel.append(dial, copy);

  return { element: panel, focus: null, read: () => '' };
}

function fieldShell(ctx: StepContext): { element: HTMLElement; box: HTMLElement } {
  const element = el('div', 'cb-step');
  const label = text('label', ctx.step.label, 'cb-label');
  label.htmlFor = `cb-${ctx.step.name}`;
  const box = el('div', 'cb-field');
  element.append(label, box);

  return { element, box };
}

interface InputOptions {
  type: string;
  inputMode: string;
  autocomplete: string;
  placeholder: string;
}

function inputFor(ctx: StepContext, options: InputOptions): HTMLInputElement {
  const input = document.createElement('input');
  input.id = `cb-${ctx.step.name}`;
  input.type = options.type;
  input.inputMode = options.inputMode;
  input.autocomplete = options.autocomplete as AutoFill;
  input.placeholder = options.placeholder;
  input.enterKeyHint = 'next';
  input.value = ctx.raw;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ctx.onSubmit();
    }
  });

  return input;
}

function chips(items: { label: string; onClick: () => void }[]): HTMLElement {
  const row = el('div', 'cb-chips');
  for (const item of items) {
    const chip = el('button', 'cb-chip');
    chip.type = 'button';
    chip.textContent = item.label;
    chip.addEventListener('click', item.onClick);
    row.append(chip);
  }

  return row;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;

  return node;
}

function text<K extends keyof HTMLElementTagNameMap>(tag: K, content: string, className = ''): HTMLElementTagNameMap[K] {
  const node = el(tag, className);
  node.textContent = content;

  return node;
}
