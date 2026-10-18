# Telko

**Mobile offers and USSD codes for Togo, open and sourced.**

Telko lists the bundles, mobile money services and USSD codes of Yas Togo and Moov Africa Togo. Each entry shows where it comes from and when it was last checked. Code builders assemble parameterized codes (transfers, purchases for someone else) and open the phone dialer in one tap.

> Status: early stage. The dataset is being collected and is **not verified yet**.

## What is in this repository

- `data/`: the dataset, one JSON file per operator and category.
- `src/`: the website (Astro, static output). `src/lib/schema.ts` validates the dataset and types the pages.
- `public/`: brand marks, flags and icons, each folder with its own credits.
- `docs/`: data schema, verification protocol, disclaimer and architecture decisions.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:4321
npm run verify   # types, data and unit tests, production build
```

## Contributing

Reports and corrections are the most valuable contributions. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

Telko is an independent community project, not affiliated with any operator. Codes and prices change: always check the confirmation screen on your phone before a money transfer. See [docs/disclaimer.md](docs/disclaimer.md).

## License

Code: [MIT](LICENSE). Data: license to be decided before the first public release (see [data/LICENSE](data/LICENSE)).
