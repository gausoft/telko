import type { BuilderCountry } from '../lib/builder-types';
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
