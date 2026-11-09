import { submissionText } from '../lib/submission';
import type { Submission } from '../lib/submission-types';

/** Posts the submission as JSON: `submission` for programs, `text` for people. Throws when the destination refuses it. */
export async function sendToWebhook(url: string, submission: Submission): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event: 'telko.contribution', text: submissionText(submission), submission }),
  });

  if (!response.ok) throw new Error(`webhook answered ${response.status}`);
}
