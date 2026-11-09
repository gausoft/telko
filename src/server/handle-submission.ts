import { parseSubmission } from '../lib/submission';
import type { Submission, SubmissionEnvelope } from '../lib/submission-types';
import type { SubmissionEnv } from './env-types';
import { verifyToken } from './turnstile';
import { sendToTelegram } from './telegram-sink';
import { sendToWebhook } from './webhook-sink';

/** Receives one proposed code: decode, check it is from a person, hand it to the configured destination. */
export async function handleSubmission(request: Request, env: SubmissionEnv): Promise<Response> {
  const body = await readJson(request);
  const envelope = (body ?? {}) as Partial<SubmissionEnvelope>;

  const parsed = parseSubmission(envelope.submission);
  if (!parsed.ok) return reply(400, { error: 'invalid', field: parsed.field });

  if (env.TURNSTILE_SECRET) {
    const token = typeof envelope.token === 'string' ? envelope.token : '';
    const human = token !== '' && (await verifyToken(env.TURNSTILE_SECRET, token, request.headers.get('CF-Connecting-IP')));
    if (!human) return reply(403, { error: 'captcha' });
  }

  const sends = destinations(env, parsed.submission);
  if (sends.length === 0) return reply(503, { error: 'no_destination' });

  const results = await Promise.allSettled(sends.map((send) => send()));
  if (results.every((result) => result.status === 'rejected')) return reply(502, { error: 'delivery' });

  return reply(200, { ok: true });
}

/** One sender per destination that the configuration turns on. */
function destinations(env: SubmissionEnv, submission: Submission): (() => Promise<void>)[] {
  const sends: (() => Promise<void>)[] = [];
  if (env.SUBMISSION_WEBHOOK_URL) sends.push(() => sendToWebhook(env.SUBMISSION_WEBHOOK_URL as string, submission));
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) sends.push(() => sendToTelegram(env.TELEGRAM_BOT_TOKEN as string, env.TELEGRAM_CHAT_ID as string, submission));

  return sends;
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
