# Data schema

All data lives in `data/`. Countries use their ISO 3166-1 alpha-2 code. Each operator has its own folder with one JSON file per category.

```
data/
├── countries.json
└── tg/
    ├── operators.json
    ├── featured.json
    ├── yas/
    │   ├── general.json
    │   ├── internet.json
    │   ├── mobile-money.json
    │   └── fees.json
    └── moov/
        └── ...
```

The schemas in `src/lib/schema.ts` implement this document; `npm test` validates every file against them.

## countries.json

```json
{ "countries": [{ "code": "tg", "name": "Togo", "status": "live", "dial_code": "228", "national_length": 8, "currency": "XOF", "amount_label": "F", "amount_presets": [500, 1000, 2000, 5000] }] }
```

`status` is `live` (data available) or `soon` (listed, no data yet). A `soon` country is shown in the app and has its own page, but no operator or section page is built from its folder.

| Field | Rule |
|---|---|
| `currency` | ISO 4217 code of the currency every amount of this country is written in |
| `amount_label` | How an amount is written after the figure, as on the operator's receipts: `F`, `GH₵`, `KSh`. One to four characters |
| `amount_presets` | Quick amounts of the code assistant, in that currency. One at least, six at most |
| `national_length` | Digits of a mobile number, without the country code |

## featured.json

Hand-picked items shown in the home carousel, in order. Each `entry_id` must exist in the same country; `label` is the short line shown above the offer.

```json
{
  "country": "tg",
  "updated": "2026-10-18",
  "items": [{ "entry_id": "yas-internet-net599", "label": "Le plus demandé" }],
  "shortcuts": [{ "entry_id": "yas-general-consulter-soldes", "label": "Solde", "brand": "operator" }]
}
```

`items` feed the carousel, filtered by the selected operator. `shortcuts` are the quick codes under it; `brand` picks which mark to show next to the label (`operator` or `mobile_money`). Both are edited by hand by maintainers; a dynamic source can replace this file later without changing the pages.

## operators.json

```json
{
  "country": "tg",
  "operators": [
    {
      "id": "yas",
      "name": "Yas Togo",
      "short_name": "Yas",
      "former_names": ["Togocom", "Togocel"],
      "badge": { "label": "Y", "background": "#00377D", "foreground": "#FFFFFF" },
      "logo": "yas.svg",
      "mobile_money": { "id": "mixx", "name": "Mixx by Yas", "short_name": "Mixx", "former_names": ["T-Money"], "badge": { "label": "Mx", "background": "#FFD100", "foreground": "#00377D" }, "logo": "mixx.svg" },
      "prefixes": [],
      "website": "https://yas.tg",
      "customer_service": "888",
      "provenance": { "status": "unverified", "sources": [{ "url": "https://yas.tg/particulier/assistance/", "kind": "official", "accessed": "2026-10-18" }], "verified_at": null, "verified_by": null },
      "notes": "..."
    }
  ]
}
```

`former_names` matter: users still search for old brand names.

`provenance` follows the same shape as on entries: the operator name, its service number and its website are published data, so they carry their source and date like everything else. An official page is enough, a device test always counts.

`badge` is the fallback shown when logos are disabled or missing: a short label on the brand color, with a foreground that keeps a 4.5:1 contrast. `logo` is a file name in `public/brands/`, or `null`.

`prefixes` stays empty unless an official numbering source is cited. Mobile number portability has been in force in Togo since 3 May 2024, so a prefix does not identify the operator. Do not build operator detection on prefixes.

`customer_service` is shown and dialled as it is, so it accepts digits, spaces and an optional leading `+`, nothing else: a USSD code would carry a menu and could ask for a PIN. `null` when the operator publishes no number.

## Category file

```json
{
  "operator": "yas",
  "category": "internet",
  "entries": [ ... ]
}
```

Allowed categories: `general`, `internet`, `mixed`, `voice-sms`, `weekend`, `roaming`, `international`, `credit-transfer`, `mobile-money`, `bills`, `useful-numbers`.

## Entry

```json
{
  "id": "yas-internet-net5000",
  "kind": "bundle",
  "name": "Net5000",
  "description": "6 Go valables 30 jours",
  "price": 5000,
  "allowances": { "data_mb": 6144, "voice_min": null, "sms": null },
  "validity": { "days": 30, "label": "30 jours" },
  "time_window": null,
  "ussd": { "template": "*909*232#", "params": [] },
  "payment_methods": ["airtime"],
  "third_party": null,
  "tags": ["mensuel", "4g"],
  "provenance": {
    "status": "unverified",
    "sources": [
      { "url": "https://yas.tg/...", "kind": "official", "accessed": "2026-10-18" }
    ],
    "verified_at": null,
    "verified_by": null
  },
  "notes": null
}
```

| Field | Type | Rule |
|---|---|---|
| `id` | string | `<operator>-<category>-<slug>`, unique, never reused |
| `kind` | `bundle` \| `service` | A bundle has a price and allowances; a service is an action (balance, transfer, bill payment) |
| `name` | string | Exact commercial name, as the operator writes it |
| `description` | string | One short sentence in French, the source language |
| `price` | integer \| null | Price in the currency of the country, written as `amount_label`. `null` for free or variable services |
| `allowances` | object \| null | `data_mb`, `voice_min`, `sms` as integers, or `null`. `-1` means unlimited |
| `validity` | object \| null | `days` (integer, or `null` for validities under a day) and `label` as written by the operator (e.g. "24 h") |
| `time_window` | object \| null | e.g. `{ "from": "22:00", "to": "06:00" }` for night bundles |
| `ussd.template` | string | The code with `{param}` placeholders, e.g. `*155*1*1*{phone}*{amount}*{pin}#` |
| `ussd.params` | array | See below. Empty for fixed codes |
| `payment_methods` | array | `airtime`, or the `id` of a mobile money service of the same operator. Never another operator's service |
| `third_party` | object \| null | Same shape as `ussd`, when the bundle can be bought for someone else |
| `tags` | array of strings | Free tags in French, used for search in both languages |
| `provenance` | object | See below. Required |
| `notes` | string \| null | Known caveats, in French |
| `en` | object | English text: `name`, `description`, `notes`. See [Translations](#translations) |

## Parameters

```json
{ "name": "phone", "type": "phone", "label": "Numéro du destinataire", "required": true }
```

`type` is one of `phone`, `amount`, `pin`, `text`, `choice`.

The code assistant builds its screens from these fields alone, so a new code needs no new UI. Optional hints:

| Field | Applies to | Meaning |
|---|---|---|
| `short` | all | Few words shown inside the one-line code (default by type: Numéro, Montant, Code) |
| `format` | `phone` | `national` (default, country digits only), `international` (country code + number), `any` (digits as typed) |
| `min`, `max`, `presets` | `amount` | Bounds in the currency of the country and quick picks (defaults come from `amount_presets`) |
| `length`, `numeric` | `text` | Exact length and digits-only keyboard |
| `options` | `choice` | `[{ "value": "1", "label": "…" }]` |

The assistant asks each box once, in code order. A box used twice (a confirmation) is filled twice.

## Translations

French is the source language. Any object that holds French text may carry an `en` object with the same keys, translated:

| Where | `en` keys |
|---|---|
| Entry | `name`, `description`, `notes` |
| `validity` | `label` |
| Parameter | `label`, `short`; each option: `label` (never `value`) |
| Fee line | `label`, `notes` |
| Featured item, shortcut | `label` |
| Operator | `notes` |
| Country | `name` |

```json
{ "name": "Net599", "description": "5 Go valables 24 h.", "en": { "name": "Net599", "description": "5 GB, valid 24 h." } }
```

- Each key is optional: a missing one shows the French text. Unknown keys are refused, so a typo never hides a translation.
- `npm test` lists every French text without its English version; the dataset ships complete.
- Product names stay as they are (`Net599`). Write volumes as MB and GB; keep prices as `5 000 F`.
- A fee label written `condition : amount` keeps one colon in English (`From 1 to 500 F: 50 F`): the fee table splits on it.
- Logic never reads the English text: the period filter of data bundles uses the French `validity.label`.

A `pin` parameter is never asked, stored, shared or prefilled. The assistant dials the code up to the first `pin`, closed with `#` (`*155*1*1*90000000*500#`), and the operator's menu asks for the secret code. A code ending with `*` must never be dialed: phones treat it as a phone call.

## Fees file

Each operator folder may hold a `fees.json` for its mobile money service:

```json
{
  "operator": "yas",
  "service": "mixx",
  "entries": [
    {
      "id": "yas-fees-withdrawal-5001-10000",
      "operation": "withdrawal",
      "min": 5001,
      "max": 10000,
      "fee": 200,
      "fee_percent": null,
      "label": "Retrait de 5 001 à 10 000 FCFA",
      "provenance": { "...": "same shape as entries" },
      "notes": null
    }
  ]
}
```

| Field | Rule |
|---|---|
| `operation` | `withdrawal`, `deposit`, `receive`, `transfer-national`, `transfer-regional`, `transfer-cross-network`, `transfer-bank`, `other` |
| `min`, `max` | Amount range in the currency of the country, inclusive. `max` is `null` when open-ended |
| `fee` / `fee_percent` | A flat fee or a percentage. Both `null` when the fee is unknown |

The example values are illustrative, not real fees.

## Provenance

| Field | Rule |
|---|---|
| `status` | `unverified`, `verified`, `stale` or `discontinued` |
| `sources[].kind` | `official` (operator or regulator page), `device` (tested on a phone, with screenshot), `secondary` (blog, app, forum) |
| `sources[].accessed` | ISO date the source was read |
| `verified_at` | ISO date of the last successful verification, or `null` |
| `verified_by` | GitHub handle of the verifier, or `null` |

See `verification-protocol.md` for how each status is reached.
