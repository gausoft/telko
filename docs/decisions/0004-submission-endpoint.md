# 4. Submission endpoint, destination chosen by configuration

Date: 2026-11-09. Status: accepted, amends [0002](0002-no-backend-v1.md).

## Context

Anyone should be able to propose a code without a GitHub account. The site stays static; a single optional function receives submissions.

## Decision

- The assistant posts one JSON `Submission` (see `src/lib/submission-types.ts`) to `PUBLIC_SUBMISSION_ENDPOINT`. When it is empty, the assistant falls back to a prefilled GitHub issue.
- `functions/api/contribute.ts` (Cloudflare Pages Function) validates the payload, checks the optional Turnstile token, then posts to `SUBMISSION_WEBHOOK_URL`. Nothing is hard-coded: the destination is any web address that accepts JSON.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (secrets, never committed) add a Telegram message to the owner. Webhook and Telegram can run together.
- `TURNSTILE_SECRET` (server) and `PUBLIC_TURNSTILE_SITEKEY` (build) switch the anti-bot check on.
- Another host can reuse `src/server/handle-submission.ts` behind its own route.

## Consequences

The function is optional and Cloudflare-specific only in its thin wrapper. The optional contact field is sent to the destination only, never published.
