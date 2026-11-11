import type { Submission, SubmissionEnvelope } from '../lib/submission-types';

export type PostOutcome = 'ok' | 'captcha' | 'failed';

/** Posts one submission to the configured endpoint. Never throws: the page only needs to know what to tell the visitor. */
export async function postSubmission(endpoint: string, submission: Submission, token: string): Promise<PostOutcome> {
  const envelope: SubmissionEnvelope = { submission, token };

  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(envelope) });
    if (response.ok) return 'ok';

    return response.status === 403 ? 'captcha' : 'failed';
  } catch {
    return 'failed';
  }
}
