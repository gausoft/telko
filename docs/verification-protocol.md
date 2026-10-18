# Verification protocol

Telko is only useful if its data is right. A wrong transfer code can send money to the wrong person. This protocol defines when an entry can be trusted.

## Statuses

| Status | Meaning | Shown to users as |
|---|---|---|
| `unverified` | Found in a source, not confirmed | "Non vérifié", with the source date |
| `verified` | Confirmed by an accepted proof within the freshness window | "Vérifié le <date>" |
| `stale` | Was verified, but the freshness window has passed | "À revérifier" |
| `discontinued` | Confirmed withdrawn by the operator | Hidden from listings, page kept with a notice |

## Accepted proofs

An entry becomes `verified` with at least one of:

1. **Device test**: the code was dialed on a real SIM of that operator and the resulting menu or confirmation matches the entry. Attach a screenshot to the pull request, with phone numbers and balances blurred.
2. **Official page**: the operator's own website or the regulator (ARCEP Togo) states the code, price and validity. Link it with the access date.

Blogs, third-party apps, forums and social media posts are `secondary` sources. They can create an `unverified` entry, never a `verified` one.

For money transfers and payments, only a **device test** counts. Never complete a real transfer to test: stop at the confirmation screen.

## Freshness

| Category | Re-verify after |
|---|---|
| `mobile-money`, `credit-transfer`, `bills` | 90 days |
| `internet`, `mixed`, `voice-sms`, `weekend` | 60 days |
| `general`, `useful-numbers`, `roaming`, `international` | 180 days |

An entry past its window moves to `stale` automatically at build time.

## Reports

A "broken code" report on an entry:

1. moves it to `stale` until checked;
2. is answered within 7 days by a device test;
3. ends with a fix, a `discontinued` status, or a closed report if the code works.

## Conflicts between sources

When two sources disagree on a price, code or validity, the entry stays `unverified` and the conflict is described in `notes` until a device test settles it.
