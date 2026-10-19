# Adding a country

Telko is one folder per country, `data/<ISO 3166-1 alpha-2 code>/`. A country goes live when someone who lives there brings its data and can test codes on a local SIM. Until then it stays `soon`: the app shows its page, with what is already known and its sources, and nothing is invented.

Open an issue first with the **Bring your country** template, so no one duplicates the work.

## 1. List the country

Add it to `data/countries.json`, keeping `"status": "soon"`:

```json
{ "code": "bj", "name": "Bénin", "status": "soon", "dial_code": "229", "national_length": 10, "currency": "XOF", "amount_label": "F", "amount_presets": [500, 1000, 2000, 5000] }
```

`currency` is the ISO 4217 code of the money users see, `amount_label` how it is written after an amount (`F`, `GH₵`), and `amount_presets` the amounts offered by the code assistant. A country outside the CFA franc zone is welcome; only those three fields change.

## 2. Scaffold the folder

```bash
npm run new-country bj
```

It writes an empty `data/bj/operators.json`, the only file the app needs to start reading a country, and prints the next steps.

## 3. Fill in the operators

`data/bj/operators.json` holds one object per mobile operator, each with its mobile money service, its customer service number, its website and a `provenance` block. The full shape is in [the data schema](data-schema.md#operatorsjson).

- `id` is short and lowercase (`mtn`, `moov`, `celtiis`); it becomes the folder name and part of the page URLs.
- `former_names` holds the names users still search for (`Spacetel Bénin` for MTN Benin).
- `badge` is the coloured disc shown when there is no logo. Logos go to `public/brands/` with their source, and only with written permission from the operator: without it, the badge is enough.
- `customer_service` is the published service number, or `null` when the operator publishes none. Never guess it.
- `provenance.sources` lists what backs the operator: an official page of the operator, or the telecom regulator. `accessed` is the day you read it.

## 4. Add the flag

Download `public/flags/<code>.svg` from [circle-flags](https://github.com/HatScripts/circle-flags) and keep the file name: `npm test` fails when a listed country has no flag.

## 5. Add the data

One folder per operator, one file per category, in the shape of `data/tg/`:

```
data/bj/
├── operators.json
├── mtn/
│   ├── internet.json
│   ├── mobile-money.json
│   ├── fees.json
│   └── general.json
└── moov/
    └── ...
```

Rules that apply to every file:

- **Every entry carries a `provenance`** with its sources and the day you read them. An entry without a source is not published.
- **Entries start as `unverified`.** It becomes `verified` only after a test on a real phone, as described in the [verification protocol](verification-protocol.md).
- **Never a PIN.** No secret code in the data, in a link or in a screenshot. A code with a PIN is written up to the PIN and closed with `#`.
- **French text carries an `en` block** with the same keys. If you do not write English, add the French only: `npm test` lists what is missing.
- **A folder is checked as soon as it exists**, even while the country is `soon`. Errors name the file and the field, so you can iterate long before going live.

## 6. Check

```bash
npm run verify   # types, data checks, unit tests, production build
```

## 7. Go live

In the same pull request, switch the country to `"status": "live"` in `data/countries.json`. From then on the app builds its operator and section pages, its share images, and lists it in the sitemap and in search.

Going live is not the end: prices change, codes expire. Each entry has its own freshness window, and the country page shows the day its data was last read.
