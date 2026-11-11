import { splitParts, withVariables } from '../lib/code-parts';
import type { PartKind } from '../lib/code-parts-types';
import { checkCode, issueUrl } from '../lib/contribution';
import { submissionOf } from '../lib/submission';
import { mountTurnstile } from './turnstile-widget';
import { postSubmission } from './post-submission';
import type { ContributionDraft, ContributionProof } from '../lib/contribution-types';
import type { ContributeData } from './contribute-types';

/** Wires the assistant: one step at a time, a check before each "Continue", then a prefilled GitHub link. Text only, never HTML. */
export function startContribute(): void {
  const root = document.querySelector<HTMLElement>('[data-contribute]');
  const raw = document.getElementById('ct-data')?.textContent;
  if (!root || !raw) return;

  const data = JSON.parse(raw) as ContributeData;
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
  const review = steps.length - 1;
  let index = 0;
  let editing = false;

  const show = (next: number): void => {
    index = Math.max(0, Math.min(review, next));
    steps.forEach((step, i) => (step.hidden = i !== index));
    if (index === 1) syncServices(root);
    steps[index]?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  };

  const showError = (message: string | null): boolean => {
    const box = steps[index]?.querySelector<HTMLElement>('[data-error]');
    if (box) {
      box.textContent = message ?? '';
      box.hidden = message === null;
    }

    return message === null;
  };

  const goReview = (): void => {
    editing = false;
    draw(root, data);
    show(review);
  };

  const advance = (): void => {
    if (!showError(problem(index, root, data))) return;
    if (editing && index === 0) return show(1);
    if (editing) return goReview();
    if (index === review - 1) return goReview();

    show(index + 1);
  };

  const back = (): void => {
    if (editing) return goReview();
    if (index === 0) return window.location.assign(root.dataset['back'] ?? '/');

    show(index - 1);
  };

  const token = mountTurnstile(root.querySelector<HTMLElement>('[data-turnstile]'), data.siteKey);
  const submit = root.querySelector<HTMLButtonElement>('[data-submit]');
  submit?.addEventListener('click', () => {
    const fail = root.querySelector<HTMLElement>('[data-send-error]');
    submit.disabled = true;
    submit.textContent = data.text.sending;
    if (fail) fail.hidden = true;

    void postSubmission(data.endpoint, submissionOf(draftOf(root), data), token.value()).then((outcome) => {
      if (outcome === 'ok') {
        steps.forEach((step) => (step.hidden = true));
        const done = root.querySelector<HTMLElement>('[data-done]');
        if (done) done.hidden = false;
        done?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
        window.scrollTo({ top: 0 });

        return;
      }

      submit.disabled = false;
      submit.textContent = data.text.send;
      token.reset();
      if (fail) {
        fail.textContent = outcome === 'captcha' ? data.errors.captcha : data.errors.send;
        fail.hidden = false;
      }
    });
  });

  root.querySelector('[name="code"]')?.addEventListener('input', () => drawParts(root, data));
  root.querySelectorAll('[name="varies"]').forEach((radio) => radio.addEventListener('change', () => drawParts(root, data)));
  root.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', advance));
  root.querySelectorAll('[data-prev]').forEach((button) => button.addEventListener('click', back));
  root.querySelectorAll<HTMLElement>('[data-edit]').forEach((button) =>
    button.addEventListener('click', () => {
      editing = true;
      show(Number(button.dataset['edit']));
    }),
  );
}

function field(root: HTMLElement, name: string): string {
  const input = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]:not([type="radio"])`);

  return input?.value.trim() ?? '';
}

function choice(root: HTMLElement, name: string): string {
  return root.querySelector<HTMLInputElement>(`[name="${name}"]:checked`)?.value ?? '';
}

/** The message to show when the current step cannot move on, or null. */
function problem(step: number, root: HTMLElement, data: ContributeData): string | null {
  if (step === 0) return choice(root, 'operator') === '' ? data.errors.operator : null;

  if (step === 1) return service(root) === null ? data.errors.service : null;

  if (step === 2) {
    if (field(root, 'name') === '') return data.errors.name;
    const code = checkCode(field(root, 'code'));

    return code === 'empty' ? data.errors.codeEmpty : code === 'format' ? data.errors.codeFormat : null;
  }

  if (step === 3) return field(root, 'details') === '' ? data.errors.details : null;

  return null;
}

/** The code as typed, with the parts named phone or amount replaced by their variable. */
function finalCode(root: HTMLElement): string {
  const typed = field(root, 'code');
  if (choice(root, 'varies') !== 'yes') return typed;

  const kinds = Array.from(root.querySelectorAll<HTMLSelectElement>('[data-part]')).map((select) => select.value as PartKind);

  return withVariables(typed, kinds);
}

/** Shows the question "does it change?" for a plain code, and one row per digit group when it does. */
function drawParts(root: HTMLElement, data: ContributeData): void {
  const parts = splitParts(field(root, 'code'));
  const question = root.querySelector<HTMLElement>('[data-varies]');
  const box = root.querySelector<HTMLElement>('[data-parts]');
  const list = root.querySelector<HTMLElement>('[data-parts-list]');
  if (!question || !box || !list) return;

  const asked = choice(root, 'varies') === 'yes';
  question.hidden = parts === null;
  box.hidden = parts === null || !asked;
  if (parts === null || !asked) return;
  const kept = Array.from(list.querySelectorAll<HTMLSelectElement>('[data-part]')).map((select) => select.value);
  const rows = parts.map((part) => partRow(part, data));
  rows.forEach((row, i) => {
    const select = row.querySelector('select');
    if (select && kept[i]) select.value = kept[i];
  });

  list.replaceChildren(...rows);
}

function partRow(part: string, data: ContributeData): HTMLElement {
  const row = document.createElement('label');
  row.className = 'part';

  const value = document.createElement('span');
  value.className = 'mono';
  value.textContent = part;

  const select = document.createElement('select');
  select.dataset['part'] = '';
  for (const [kind, text] of Object.entries(data.partKinds)) select.append(new Option(text, kind));

  row.append(value, select);

  return row;
}

function syncServices(root: HTMLElement): void {
  const id = root.querySelector<HTMLInputElement>('[name="operator"]:checked')?.dataset['id'];
  root.querySelectorAll<HTMLElement>('[data-services]').forEach((group) => (group.hidden = group.dataset['services'] !== id));
}

/** The service picked for the chosen operator, or null. */
function service(root: HTMLElement): HTMLInputElement | null {
  const id = root.querySelector<HTMLInputElement>('[name="operator"]:checked')?.dataset['id'];

  return root.querySelector<HTMLInputElement>(`[name="service-${id}"]:checked`);
}

function draftOf(root: HTMLElement): ContributionDraft {
  return {
    operator: choice(root, 'operator'),
    service: service(root)?.dataset['text'] ?? '',
    contact: field(root, 'contact'),
    name: field(root, 'name'),
    code: finalCode(root),
    details: field(root, 'details'),
    proof: choice(root, 'proof') as ContributionProof,
    sourceUrl: field(root, 'sourceUrl'),
    date: new Date().toISOString().slice(0, 10),
  };
}

/** Fills the recap and points the send button at the prefilled issue. */
function draw(root: HTMLElement, data: ContributeData): void {
  const draft = draftOf(root);
  const values: Record<string, string> = {
    operator: choice(root, 'operator'),
    service: service(root)?.dataset['text'] ?? '',
    name: draft.name,
    code: draft.code,
    details: draft.details,
    proof: data.proofs[draft.proof],
  };

  for (const [key, value] of Object.entries(values)) {
    const node = root.querySelector<HTMLElement>(`[data-r="${key}"]`);
    if (node) node.textContent = value;
  }

  const mark = service(root)?.parentElement?.querySelector('.brand-mark');
  root.querySelector('[data-r-mark]')?.replaceChildren(...(mark ? [mark.cloneNode(true)] : []));

  const send = root.querySelector<HTMLAnchorElement>('[data-send]');
  if (send) send.href = issueUrl(draft, { repoUrl: data.repoUrl, template: data.template });
}
