import { describe, expect, it, vi } from 'vitest';

import { parseSubmission, submissionText } from '../src/lib/submission';
import { handleSubmission } from '../src/server/handle-submission';

const valid = {
  country: 'tg',
  lang: 'fr',
  operator: 'Yas Togo',
  service: 'Mobile money',
  name: 'Transfert',
  code: '*155*1*1*{phone}*{amount}#',
  details: 'Transfert national',
  proof: 'device',
  sourceUrl: '',
  contact: '',
  date: '2026-11-09',
};

const post = (body: unknown): Request => new Request('https://x.test/api/contribute', { method: 'POST', body: JSON.stringify(body) });

describe('submission parsing', () => {
  it('accepts a complete submission', () => {
    expect(parseSubmission(valid)).toEqual({ ok: true, submission: valid });
  });

  it('names the first wrong field', () => {
    expect(parseSubmission({ ...valid, code: '909' })).toEqual({ ok: false, field: 'code' });
    expect(parseSubmission({ ...valid, proof: 'x' })).toEqual({ ok: false, field: 'proof' });
    expect(parseSubmission({ ...valid, sourceUrl: 'javascript:1' })).toEqual({ ok: false, field: 'sourceUrl' });
    expect(parseSubmission({ ...valid, details: 'a'.repeat(1001) })).toEqual({ ok: false, field: 'details' });
    expect(parseSubmission(null)).toEqual({ ok: false, field: 'body' });
  });

  it('adds the contact line only when given', () => {
    expect(submissionText(valid as never)).not.toContain('Contact');
    expect(submissionText({ ...valid, contact: '90123456' } as never)).toContain('Contact: 90123456');
  });
});

describe('submission endpoint', () => {
  it('refuses a malformed body', async () => {
    const response = await handleSubmission(post({ submission: { ...valid, name: '' } }), { SUBMISSION_WEBHOOK_URL: 'https://hook.test' });
    expect(response.status).toBe(400);
  });

  it('answers 503 while no destination is configured', async () => {
    expect((await handleSubmission(post({ submission: valid }), {})).status).toBe(503);
  });

  it('requires a human token when a secret is set', async () => {
    const response = await handleSubmission(post({ submission: valid }), { SUBMISSION_WEBHOOK_URL: 'https://hook.test', TURNSTILE_SECRET: 's' });
    expect(response.status).toBe(403);
  });

  it('forwards a valid submission to the destination', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleSubmission(post({ submission: valid }), { SUBMISSION_WEBHOOK_URL: 'https://hook.test' });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith('https://hook.test', expect.objectContaining({ method: 'POST' }));
    vi.unstubAllGlobals();
  });

  it('sends to Telegram when a bot is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleSubmission(post({ submission: valid }), { TELEGRAM_BOT_TOKEN: 'T', TELEGRAM_CHAT_ID: '42' });

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.telegram.org/botT/sendMessage');
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body).chat_id).toBe('42');
    vi.unstubAllGlobals();
  });

  it('reports a destination that refuses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    expect((await handleSubmission(post({ submission: valid }), { SUBMISSION_WEBHOOK_URL: 'https://hook.test' })).status).toBe(502);
    vi.unstubAllGlobals();
  });
});
