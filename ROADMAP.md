# Roadmap

What Telko does today and what comes next. Dates are not promised: priorities follow what users report. Each item links to its issue once it is open.

## Available

- First live country, Togo: Yas Togo with Mixx, Moov Africa Togo with Moov Money.
- A country model ready for any African country: one data folder per country, country picker, pages and offline pack per country.
- A page for every listed country, live or soon, with its operators and their sources.
- Data bundles, calls and SMS, mobile money, bills, fees and useful codes, about 200 codes in all.
- One tap to dial, and a code assistant for codes with parameters (amount, number, card).
- Search, offline mode and installation as an app.
- One page per operator and section, with link previews for messaging apps.

## Next

1. **Verify codes on real phones** ([#1](https://github.com/gausoft/telko/issues/1)), starting with the codes that move money. Each confirmed code switches from "unverified" to "verified" with its proof.
2. **Fee calculator** ([#2](https://github.com/gausoft/telko/issues/2)): type an amount, see the transfer and withdrawal fees of each mobile money service.
3. **Help pages** ([#3](https://github.com/gausoft/telko/issues/3)) for frequent problems: cancel a transfer, forgotten or blocked secret code, money sent to the wrong number.
4. **Interoperable transfers** ([#4](https://github.com/gausoft/telko/issues/4)): a page on PI-SPI, the regional instant payment system, and how it changes fees between services.
5. **Desktop layout** ([#5](https://github.com/gausoft/telko/issues/5)) of every screen.

## More countries

Telko is built for Africa, one country at a time ([#6](https://github.com/gausoft/telko/issues/6)). The WAEMU countries (Benin, Burkina Faso, Côte d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal) are already listed in the app, each with its own page. Benin is the next one: its three operators (MTN, Moov Africa, Celtiis) are sourced, and its offers are being collected. Any other country is welcome. It goes live when contributors who live there bring and check its data: open a [Bring your country](https://github.com/gausoft/telko/issues/new?template=new-country.yml) issue, then follow [Add a country](docs/adding-a-country.md).

- **Prices in any currency.** Prices are stored in the currency of the country (`currency`, `amount_label`), so countries outside the CFA franc zone (Ghana, Nigeria, Kenya...) only need their own presets.

## Later

- One page per offer, shareable on its own.
- Change history of prices and codes.
