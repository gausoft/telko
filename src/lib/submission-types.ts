import type { ContributionProof } from './contribution-types';

export type SubmissionLang = 'fr' | 'en';

/** One proposed code, as the assistant sends it to any destination. This is the public contract of the submission endpoint. */
export interface Submission {
  country: string;
  lang: SubmissionLang;
  operator: string;
  service: string;
  name: string;
  code: string;
  details: string;
  proof: ContributionProof;
  sourceUrl: string;
  contact: string;
  /** ISO day the visitor saw the code work or read it. */
  date: string;
}

/** What the browser posts: the submission, plus the anti-bot token when the site uses one. */
export interface SubmissionEnvelope {
  submission: Submission;
  token: string;
}

export type SubmissionParse = { ok: true; submission: Submission } | { ok: false; field: string };

/** Which country and language the assistant was opened in. */
export interface SubmissionContext {
  country: string;
  lang: SubmissionLang;
}
