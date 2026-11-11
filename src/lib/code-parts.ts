import type { PartKind } from './code-parts-types';

/** A plain dialled code: stars between digit groups, one # at the end. Only these can be split into parts. */
const PLAIN_CODE = /^\*([0-9]+(?:\*[0-9]+)*)#$/;

const VARIABLES: Record<Exclude<PartKind, 'fixed'>, string> = { phone: '{phone}', amount: '{amount}' };

/** The digit groups of a plain code, or null when the code has another shape. */
export function splitParts(code: string): string[] | null {
  const match = PLAIN_CODE.exec(code.trim());

  return match?.[1] ? match[1].split('*') : null;
}

/** The code with each part the visitor called a phone number or an amount replaced by its variable. */
export function withVariables(code: string, kinds: PartKind[]): string {
  const parts = splitParts(code);
  if (parts === null) return code.trim();

  const written = parts.map((part, i) => {
    const kind = kinds[i] ?? 'fixed';

    return kind === 'fixed' ? part : VARIABLES[kind];
  });

  return `*${written.join('*')}#`;
}
