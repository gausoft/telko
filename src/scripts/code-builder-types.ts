import type { BuilderCountry, BuilderEntry, BuilderPayload } from '../lib/builder-types';
import type { BuiltCode, Step } from '../lib/ussd-flow-types';
import type { Recipient } from './recipients-types';

/** What a step panel exposes to the assistant. */
export interface StepView {
  element: HTMLElement;
  /** Field to focus when the panel appears. */
  focus: HTMLElement | null;
  read(): string;
}

export interface StepContext {
  step: Step;
  /** What the user typed last time on this step, restored when going back. */
  raw: string;
  country: BuilderCountry;
  recipients: Recipient[];
  onPickCountry(): void;
  onPickRecipient(recipient: Recipient): void;
  onSubmit(): void;
}

export interface ReviewContext {
  built: BuiltCode;
  onDial(): void;
}

export interface BuilderState {
  entry: BuilderEntry;
  steps: Step[];
  index: number;
  /** Validated values, as they go into the code. */
  values: Record<string, string>;
  /** What the user typed, kept when going back or changing country. */
  raw: Record<string, string>;
  country: BuilderCountry;
  fresh: string | null;
}

export interface BuilderUi {
  sheet: HTMLDialogElement;
  title: HTMLElement;
  progress: HTMLElement;
  code: HTMLElement;
  stage: HTMLElement;
  error: HTMLElement;
  next: HTMLButtonElement;
  back: HTMLButtonElement;
  countrySheet: HTMLDialogElement | null;
}

export interface Builder {
  payload: BuilderPayload;
  home: BuilderCountry;
  ui: BuilderUi;
  state: BuilderState | null;
  view: StepView | null;
  syncCountryList(code: string): void;
}

export interface InputOptions {
  type: string;
  inputMode: string;
  autocomplete: string;
  placeholder: string;
}
