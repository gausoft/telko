import type { BuilderPayload } from '../lib/builder-types';
import { buildCode, codeTokens, dialTokens, planSteps, validateStep } from '../lib/ussd-flow';
import { bindChoiceList } from './choice-list';
import { reviewView, stepView } from './code-builder-steps';
import type { Builder, BuilderState, BuilderUi, StepView } from './code-builder-types';
import { codeLineElement } from './code-line';
import { readRecipients, rememberRecipient } from './recipients';

/** Opens the code assistant on any element with data-build="<entry id>". */
export function startCodeBuilder(): void {
  const payload = readPayload();
  const sheet = document.querySelector<HTMLDialogElement>('#code-builder');
  const home = payload?.countries.find((c) => c.code === payload.home);
  if (!payload || !sheet || !home) return;

  const builder: Builder = { payload, home, ui: findUi(sheet), state: null, view: null, syncCountryList: () => undefined };

  wireCountryList(builder);
  builder.ui.next.addEventListener('click', () => next(builder));
  builder.ui.back.addEventListener('click', () => back(builder));
  document.addEventListener('click', (event) => open(builder, event));
}

function readPayload(): BuilderPayload | null {
  const raw = document.querySelector('#code-builder-data')?.textContent;

  return raw ? (JSON.parse(raw) as BuilderPayload) : null;
}

function findUi(sheet: HTMLDialogElement): BuilderUi {
  return {
    sheet,
    title: query(sheet, '#code-builder-title'),
    progress: query(sheet, '[data-cb-progress]'),
    code: query(sheet, '[data-cb-code]'),
    stage: query(sheet, '[data-cb-stage]'),
    error: query(sheet, '[data-cb-error]'),
    next: query<HTMLButtonElement>(sheet, '[data-cb-next]'),
    back: query<HTMLButtonElement>(sheet, '[data-cb-back]'),
    countrySheet: document.querySelector<HTMLDialogElement>('#cb-country-sheet'),
  };
}

function query<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`Code builder: missing ${selector}`);

  return node;
}

function wireCountryList(builder: Builder): void {
  const list = builder.ui.countrySheet?.querySelector<HTMLElement>('[data-choice-list]');
  if (!list) return;

  const handle = bindChoiceList(list, ([code]) => {
    const picked = builder.payload.countries.find((c) => c.code === code);
    // Close first: while the picker is open the assistant is inert and could not take focus.
    builder.ui.countrySheet?.close();
    if (!builder.state || !picked) return;

    builder.state.country = picked;
    render(builder, 'none');
  });
  builder.syncCountryList = (code) => handle.set([code]);
}

function open(builder: Builder, event: Event): void {
  const trigger = (event.target as Element | null)?.closest<HTMLElement>('[data-build]');
  const entry = builder.payload.entries[trigger?.dataset['build'] ?? ''];
  if (!entry) return;

  builder.state = { entry, steps: planSteps(entry.ussd), index: 0, values: {}, raw: {}, country: builder.home, fresh: null };
  builder.syncCountryList(builder.home.code);
  builder.ui.sheet.showModal();
  render(builder, 'none');
}

function render(builder: Builder, direction: 'none' | 'forward' | 'back'): void {
  const { state, ui } = builder;
  if (!state) return;

  const step = state.steps[state.index];
  const tokens = step ? codeTokens(state.entry.ussd, state.values) : dialTokens(state.entry.ussd, state.values);

  ui.title.textContent = state.entry.title;
  ui.progress.replaceChildren(...progressDots(state.steps.length + 1, state.index));
  ui.code.replaceChildren(codeLineElement(tokens, state.fresh));
  ui.error.textContent = '';
  ui.back.hidden = state.index === 0;
  ui.next.hidden = !step;
  ui.next.textContent = state.index === state.steps.length - 1 ? 'Vérifier' : 'Suivant';

  builder.view = viewFor(builder, state);
  builder.view.element.classList.add(`cb-enter-${direction}`);
  ui.stage.replaceChildren(builder.view.element);
  builder.view.focus?.focus({ preventScroll: true });
}

function viewFor(builder: Builder, state: BuilderState): StepView {
  const step = state.steps[state.index];
  if (!step) return reviewView({ built: buildCode(state.entry.ussd, state.values), onDial: () => remember(state) });

  return stepView({
    step,
    raw: state.raw[step.name] ?? '',
    country: state.country,
    recipients: readRecipients(),
    onPickCountry: () => {
      saveDraft(builder);
      builder.syncCountryList(state.country.code);
      builder.ui.countrySheet?.showModal();
    },
    onPickRecipient: (r) => {
      state.country = builder.payload.countries.find((c) => c.code === r.country) ?? state.country;
      state.raw[step.name] = r.number;
      render(builder, 'none');
    },
    onSubmit: () => next(builder),
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

function next(builder: Builder): void {
  const { state, view } = builder;
  const step = state?.steps[state.index];
  if (!state || !step || !view) return;

  const raw = view.read();
  const result = validateStep(step, raw, { dialCode: state.country.dialCode, nationalLength: state.country.nationalLength, homeDialCode: builder.home.dialCode });
  state.raw[step.name] = raw;
  if (!result.ok) {
    builder.ui.error.textContent = result.message;
    return;
  }

  state.values[step.name] = result.value;
  state.fresh = step.name;
  state.index += 1;
  render(builder, 'forward');
}

function back(builder: Builder): void {
  const { state } = builder;
  if (!state || state.index === 0) return;

  saveDraft(builder);
  state.index -= 1;
  state.fresh = null;
  render(builder, 'back');
}

/** Keeps what is typed in the current step, valid or not, before the panel is replaced. */
function saveDraft(builder: Builder): void {
  const step = builder.state?.steps[builder.state.index];
  if (builder.state && step && builder.view) builder.state.raw[step.name] = builder.view.read();
}

/** Only validated national numbers are kept, with the country they were checked against. */
function remember(state: BuilderState): void {
  for (const step of state.steps) {
    const value = state.values[step.name];
    if (step.type !== 'phone' || !value || step.format === 'any') continue;

    const national = step.format === 'international' ? value.slice(state.country.dialCode.length) : value;
    rememberRecipient({ country: state.country.code, number: national });
  }
}
