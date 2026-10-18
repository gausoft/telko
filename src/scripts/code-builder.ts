import type { BuilderCountry, BuilderEntry, BuilderPayload } from '../lib/builder-types';
import { buildCode, codeTokens, planSteps, validateStep } from '../lib/ussd-flow';
import type { Step } from '../lib/ussd-flow-types';
import { bindChoiceList } from './choice-list';
import { reviewView, stepView } from './code-builder-steps';
import type { StepView } from './code-builder-types';
import { codeLineElement } from './code-line';
import { readRecipients, rememberRecipient } from './recipients';

interface State {
  entry: BuilderEntry;
  steps: Step[];
  index: number;
  values: Record<string, string>;
  raw: Record<string, string>;
  country: BuilderCountry;
  fresh: string | null;
}

/** Opens the code assistant on any element with data-build="<entry id>". */
export function startCodeBuilder(): void {
  const payload = readPayload();
  const sheet = document.querySelector<HTMLDialogElement>('#code-builder');
  const home = payload?.countries.find((c) => c.code === payload.home);
  if (!payload || !sheet || !home) return;

  const ui = {
    title: query(sheet, '#code-builder-title'),
    progress: query(sheet, '[data-cb-progress]'),
    code: query(sheet, '[data-cb-code]'),
    stage: query(sheet, '[data-cb-stage]'),
    error: query(sheet, '[data-cb-error]'),
    next: query<HTMLButtonElement>(sheet, '[data-cb-next]'),
    back: query<HTMLButtonElement>(sheet, '[data-cb-back]'),
  };
  const countrySheet = document.querySelector<HTMLDialogElement>('#cb-country-sheet');
  const countryList = countrySheet?.querySelector<HTMLElement>('[data-choice-list]');
  let state: State | null = null;
  let view: StepView | null = null;

  const render = (direction: 'none' | 'forward' | 'back'): void => {
    if (!state) return;
    const s = state;
    const step = s.steps[s.index];

    ui.title.textContent = s.entry.title;
    ui.progress.replaceChildren(...progressDots(s.steps.length + 1, s.index));
    ui.code.replaceChildren(codeLineElement(codeTokens(s.entry.ussd, s.values), s.fresh));
    ui.error.textContent = '';
    ui.back.hidden = s.index === 0;
    ui.next.hidden = !step;
    ui.next.textContent = s.index === s.steps.length - 1 ? 'Vérifier' : 'Suivant';

    view = step
      ? stepView({
          step,
          raw: s.raw[step.name] ?? '',
          country: s.country,
          recipients: readRecipients(),
          onPickCountry: () => countrySheet?.showModal(),
          onPickRecipient: (r) => {
            s.country = payload.countries.find((c) => c.code === r.country) ?? s.country;
            s.raw[step.name] = r.number;
            render('none');
          },
          onSubmit: next,
        })
      : reviewView({ built: buildCode(s.entry.ussd, s.values), onDial: () => remember(s) });

    view.element.classList.add(`cb-enter-${direction}`);
    ui.stage.replaceChildren(view.element);
    view.focus?.focus({ preventScroll: true });
  };

  function next(): void {
    const step = state?.steps[state.index];
    if (!state || !step || !view) return;

    const raw = view.read();
    const result = validateStep(step, raw, { dialCode: state.country.dialCode, nationalLength: state.country.nationalLength, homeDialCode: home?.dialCode ?? '' });
    if (!result.ok) {
      ui.error.textContent = result.message;
      return;
    }

    state.raw[step.name] = raw;
    state.values[step.name] = result.value;
    state.fresh = step.name;
    state.index += 1;
    render('forward');
  }

  ui.next.addEventListener('click', next);
  ui.back.addEventListener('click', () => {
    if (!state || state.index === 0) return;
    state.index -= 1;
    state.fresh = null;
    render('back');
  });

  if (countryList) {
    bindChoiceList(countryList, ([code]) => {
      const picked = payload.countries.find((c) => c.code === code);
      if (state && picked) {
        state.country = picked;
        render('none');
      }
      countrySheet?.close();
    });
  }

  document.addEventListener('click', (event) => {
    const trigger = (event.target as Element | null)?.closest<HTMLElement>('[data-build]');
    const entry = payload.entries[trigger?.dataset['build'] ?? ''];
    if (!entry) return;

    state = { entry, steps: planSteps(entry.ussd), index: 0, values: {}, raw: {}, country: home, fresh: null };
    sheet.showModal();
    render('none');
  });
}

/** One dot per step plus the final screen; the current one is longer. */
function progressDots(count: number, current: number): HTMLElement[] {
  return Array.from({ length: count }, (_, i) => {
    const dot = document.createElement('span');
    if (i === current) dot.className = 'on';
    else if (i < current) dot.className = 'done';

    return dot;
  });
}

function remember(state: State): void {
  for (const step of state.steps) {
    const number = state.raw[step.name];
    if (step.type !== 'phone' || !number) continue;
    const digits = number.replace(/\D/g, '').replace(/^00/, '');
    const national = digits.startsWith(state.country.dialCode) && digits.length > state.country.nationalLength ? digits.slice(state.country.dialCode.length) : digits;
    rememberRecipient({ country: state.country.code, number: national });
  }
}

function readPayload(): BuilderPayload | null {
  const raw = document.querySelector('#code-builder-data')?.textContent;

  return raw ? (JSON.parse(raw) as BuilderPayload) : null;
}

function query<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`Code builder: missing ${selector}`);

  return node;
}
