import { submissionText } from '../lib/submission';
import type { Submission } from '../lib/submission-types';

const MAX_TEXT = 4096;

/** Sends the submission as a plain text message (no formatting, so nothing typed is ever interpreted). Throws when Telegram refuses it. */
export async function sendToTelegram(token: string, chatId: string, submission: Submission): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: submissionText(submission).slice(0, MAX_TEXT) }),
  });

  if (!response.ok) throw new Error(`telegram answered ${response.status}`);
}
