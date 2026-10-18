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
{ "countries": [{ "code": "tg", "name": "Togo", "status": "live", "dial_code": "228", "currency": "XOF" }] }
```

`status` is `live` (data available) or `soon` (listed, no data yet).

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
      "notes": "..."
    }
  ]
}
```

`former_names` matter: users still search for old brand names.

`badge` is the fallback shown when logos are disabled or missing: a short label on the brand color, with a foreground that keeps a 4.5:1 contrast. `logo` is a file name in `public/brands/`, or `null`.

`prefixes` stays empty unless an official numbering source is cited. Mobile number portability has been in force in Togo since 3 May 2024, so a prefix does not identify the operator. Do not build operator detection on prefixes.

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
  "price_xof": 5000,
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
| `name` | string | Exact commercial name, in French as the operator writes it |
| `description` | string | One short sentence in French |
| `price_xof` | integer \| null | Price in CFA francs. `null` for free or variable services |
| `allowances` | object \| null | `data_mb`, `voice_min`, `sms` as integers, or `null`. `-1` means unlimited |
| `validity` | object \| null | `days` (integer, or `null` for validities under a day) and `label` as written by the operator (e.g. "24 h") |
| `time_window` | object \| null | e.g. `{ "from": "22:00", "to": "06:00" }` for night bundles |
| `ussd.template` | string | The code with `{param}` placeholders, e.g. `*155*1*1*{phone}*{amount}*{pin}#` |
| `ussd.params` | array | See below. Empty for fixed codes |
| `payment_methods` | array | `airtime`, `mixx`, `flooz` |
| `third_party` | object \| null | Same shape as `ussd`, when the bundle can be bought for someone else |
| `tags` | array of strings | Free tags in French, used for search |
| `provenance` | object | See below. Required |
| `notes` | string \| null | Known caveats, in French |

## Parameters

```json
{ "name": "phone", "type": "phone", "label": "Numéro du destinataire", "required": true }
```

`type` is one of `phone`, `amount`, `pin`, `text`, `choice`.

A `pin` parameter is never stored, never included in a share link, never written to history and never prefilled. When an operator flow allows it, the UI should prefer leaving the PIN to the operator's own prompt.

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
      "min_xof": 5001,
      "max_xof": 10000,
      "fee_xof": 200,
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
| `min_xof`, `max_xof` | Amount range in CFA francs, inclusive. `max_xof` is `null` when open-ended |
| `fee_xof` / `fee_percent` | A flat fee or a percentage. Both `null` when the fee is unknown |

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
