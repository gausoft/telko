import { PROOF_LABELS, checkCode } from './contribution';
import type { ContributionDraft, ContributionProof } from './contribution-types';
import type { Submission, SubmissionContext, SubmissionParse } from './submission-types';

const PROOFS: ContributionProof[] = ['device', 'official', 'other'];
const SHORT = 200;
const LONG = 1000;
// Control characters except tab and line breaks, which are folded into spaces.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const LINE_BREAKS = /[\r\n\u0085\u2028\u2029]+/g;

export function submissionOf(draft: ContributionDraft, context: SubmissionContext): Submission {
  return {
    country: context.country,
    lang: context.lang,
    operator: draft.operator,
    service: draft.service,
    name: draft.name,
    code: draft.code,
    details: draft.details,
    proof: draft.proof,
    sourceUrl: draft.sourceUrl,
    contact: draft.contact,
    date: draft.date,
  };
}

/** Decodes untrusted JSON into a submission, or names the first field that is wrong. */
export function parseSubmission(input: unknown): SubmissionParse {
  if (typeof input !== 'object' || input === null) return { ok: false, field: 'body' };
  const raw = input as Record<string, unknown>;

  // Every field lands on one labelled line of the message: line breaks are folded into spaces,
  // other control characters are refused, so a visitor cannot forge a line such as "Source : ...".
  const text = (key: string, max: number, required: boolean): string | null => {
    const value = raw[key];
    if (typeof value !== 'string') return required ? null : '';
    if (CONTROL.test(value)) return null;
    const trimmed = value.replace(LINE_BREAKS, ' ').trim();

    return trimmed.length > max || (required && trimmed === '') ? null : trimmed;
  };

  const country = text('country', 2, true);
  const operator = text('operator', SHORT, true);
  const service = text('service', SHORT, true);
  const name = text('name', SHORT, true);
  const code = text('code', SHORT, true);
  const details = text('details', LONG, true);
  const sourceUrl = text('sourceUrl', SHORT, false);
  const contact = text('contact', SHORT, false);
  const date = text('date', 10, true);
  const proof = raw['proof'];
  const lang = raw['lang'];

  const checks: [string, boolean][] = [
    ['country', country !== null && /^[a-z]{2}$/.test(country)],
    ['lang', lang === 'fr' || lang === 'en'],
    ['operator', operator !== null],
    ['service', service !== null],
    ['name', name !== null],
    ['code', code !== null && checkCode(code) === null],
    ['details', details !== null],
    ['proof', typeof proof === 'string' && (PROOFS as string[]).includes(proof)],
    ['sourceUrl', sourceUrl !== null && (sourceUrl === '' || /^https?:\/\/\S+$/.test(sourceUrl))],
    ['contact', contact !== null],
    ['date', date !== null && /^\d{4}-\d{2}-\d{2}$/.test(date)],
  ];
  const bad = checks.find(([, valid]) => !valid);
  if (bad) return { ok: false, field: bad[0] };

  return {
    ok: true,
    submission: {
      country: country as string,
      lang: lang as Submission['lang'],
      operator: operator as string,
      service: service as string,
      name: name as string,
      code: code as string,
      details: details as string,
      proof: proof as ContributionProof,
      sourceUrl: sourceUrl as string,
      contact: contact as string,
      date: date as string,
    },
  };
}

/** The message the owner reads: French, one labelled line per field, flagged as unverified. */
export function submissionText(submission: Submission): string {
  const lines = [
    'Nouvelle proposition (non vérifiée)',
    `${submission.operator}, ${submission.service} (${submission.country})`,
    `Nom : ${submission.name}`,
    `Code : ${submission.code}`,
    `Détails : ${submission.details}`,
    `Preuve : ${PROOF_LABELS[submission.proof]}`,
  ];
  if (submission.sourceUrl) lines.push(`Source : ${submission.sourceUrl}`);
  lines.push(`Date : ${frenchDate(submission.date)}`);
  if (submission.contact) lines.push(`Contact : ${submission.contact}`);

  return lines.join('\n');
}

/** 2026-11-09 becomes 09/11/2026. */
function frenchDate(iso: string): string {
  const [year, month, day] = iso.split('-');

  return `${day}/${month}/${year}`;
}
