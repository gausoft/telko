# Côte d'Ivoire collection notes

Run date: 2026-10-18. Status: **blocked, no data collected.**

## Outcome

No catalogue entry was written for Orange Côte d'Ivoire, MTN Côte d'Ivoire or Moov Africa Côte d'Ivoire. `data/countries.json` is untouched (`ci` stays `soon`) and `npm run verify` is unchanged from main.

## Why

The session's network policy denies every host this task depends on. The egress proxy answers `403` to the CONNECT request for:

- orange.ci, www.orange.ci
- mtn.ci, www.mtn.ci
- moov-africa.ci, www.moov-africa.ci
- www.artci.ci (regulator)
- wave.com, www.wave.com

The web fetch tool also fails DNS resolution on every host tried (including the secondary blog pages). Only the search tool works, and it returns short snippets with no official source.

## What the search snippets gave (not used)

Only secondary sources, which disagree with each other, so nothing was turned into an entry:

- A 2026 blog (blog.iambeezy.app) lists Orange daily passes with codes of the form `*144*1*x#` (for example 40 MB for 100 F and 1 GB for 700 F).
- A 2025 code list gives `*123*2#` to buy an internet pass and `*123*3#` to check usage; another guide gives `*144*2#`. These conflict with the blog above.
- Orange customer care is quoted as 800 or +225 07 07 11 12 12 by one guide.

Per the rules (never invent a code or a price, official sources first), these were not added. A reviewer can use them as leads only.

## Counts per operator

| Operator | general | internet | voice-sms | mixed | credit-transfer | mobile-money | bills | international | roaming | useful-numbers | fees |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Orange CI | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| MTN CI | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Moov Africa CI | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Wave

Nothing found: wave.com is blocked too. Wave stays out of the data (not an operator, no place in the schema); it still needs documenting once access works.

## Schema note for the next run

`payment_methods` only allows `airtime`, `mixx` and `flooz`. Orange Money and MTN MoMo have no value, so Côte d'Ivoire entries paid with mobile money can only use `airtime` or, for Moov Money, `flooz`. A maintainer may want to extend the enum.

## To unblock

In the environment settings, allow the hosts above (Network access, Allowed domains, or a broader level). Docs: https://code.claude.com/docs/en/cloud-environments#network-access. Then rerun the collection.

## What a reviewer should check first (once data exists)

Money-moving codes: Orange Money, MTN MoMo and Moov Money transfers, withdrawals and bill payments, and credit transfer codes. All must keep `{pin}` as a `pin` parameter and end with `#`.
