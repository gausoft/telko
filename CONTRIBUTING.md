# Contributing to Telko

Thank you for helping keep mobile codes and offers accurate. Most contributions do not require writing code.

## Report a broken code

Open an issue with the **Broken code** template. Say which code you dialed, on which operator, and what happened. A screenshot helps; blur phone numbers and balances.

## Propose a new offer or a correction

Open an issue with the **New offer** template, or edit the JSON file directly:

1. Find the file in `data/<country code>/<operator>/<category>.json` (for Togo: `data/tg/`).
2. Add or edit the entry following [`docs/data-schema.md`](docs/data-schema.md).
3. Fill `provenance` with your source and the date you read it.
4. Open a pull request.

## What counts as proof

See [`docs/verification-protocol.md`](docs/verification-protocol.md). In short:

- **Device test**: you dialed the code on a real SIM and the menu matches. Attach a screenshot.
- **Official page**: the operator or the regulator publishes it. Add the link.

Other sources (blogs, apps, social posts) are welcome but stay `unverified`.

## Safety rules

- **Never** share your PIN, in an issue, a screenshot or a pull request.
- **Never** complete a real money transfer to test a code: stop at the confirmation screen.
- Blur phone numbers, names and balances in screenshots.

## Add a country

A country goes live when people who live there bring its data and can test codes on local SIMs.

1. Open a [Bring your country](https://github.com/gausoft/telko/issues/new?template=new-country.yml) issue, so no one duplicates the work.
2. Follow [docs/adding-a-country.md](docs/adding-a-country.md): list the country in `data/countries.json` as `soon`, run `npm run new-country <code>`, fill the operators, the flag and the category files.
3. Run `npm run verify`, then switch the country to `live` in the same pull request.

While a country is `soon`, the app already gives it a page at `/<country code>` with the operators it knows and their sources. The page becomes indexable the day the country goes live.

## Working on the website

```bash
npm install
npm run dev      # local site on http://localhost:4321
npm run verify   # types, data and unit tests, production build
```

The schemas in `src/lib/schema.ts` are the single source of truth: they validate the dataset in tests and type the website. A data file that breaks them fails `npm test` with the file path and the faulty field.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) in English: `feat(data): add Moov night bundles`, `fix(ui): keep the call button in the thumb zone`.

## Language

Code, documentation and commit messages are in English. The app is in French and English.

- **Data**: French is the source text. Any object with French text also carries an `en` block with the same keys, translated (see [the schema](docs/data-schema.md#translations)). If you do not speak English, add the French only: the page shows French until someone translates it, and `npm test` lists what is missing.
- **Interface**: texts live in `src/i18n/fr.ts` and `src/i18n/en.ts`. Add a key to both; the tests check that keys and `{placeholders}` match.
- Product names (Net599, iZi'Moon) stay as they are. Prices stay in francs written `5 000 F` in both languages.
