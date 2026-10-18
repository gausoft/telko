import type { Param } from './schema';

/** One piece of a code shown on a single line: fixed characters or a box to fill. */
export type CodeToken =
  | { kind: 'text'; text: string }
  | { kind: 'slot'; name: string; short: string; value: string | null; secret: boolean };

export interface BuiltCode {
  /** What to dial, always ending with "#". */
  code: string;
  /** True when the operator's menu will ask for the secret code after dialing. */
  needsSecret: boolean;
  /** False while a box before the secret code is still empty. */
  complete: boolean;
}

/** A box the assistant asks for, once, in the order of the code. */
export type Step = Param & { short: string };

export type Validation = { ok: true; value: string } | { ok: false; message: string };

export interface PhoneContext {
  /** Country picked in the phone step. */
  dialCode: string;
  nationalLength: number;
  /** Country of the code itself: national numbers must belong to it. */
  homeDialCode: string;
}
