import type { CodeToken } from '../lib/ussd-flow-types';

/** Client twin of CodeLine.astro; `fresh` names the box that was just filled, to animate it. */
export function codeLineElement(tokens: CodeToken[], fresh: string | null = null): HTMLElement {
  const line = document.createElement('span');
  line.className = 'code-line';

  for (const token of tokens) {
    const part = document.createElement('span');
    if (token.kind === 'text') {
      part.textContent = token.text;
    } else {
      part.className = 'code-slot';
      part.classList.toggle('is-secret', token.secret);
      part.classList.toggle('is-filled', token.value !== null);
      part.classList.toggle('is-new', token.name === fresh);
      part.textContent = token.value ?? token.short;
    }
    line.append(part);
  }

  return line;
}
