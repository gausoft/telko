/**
 * Creates the data folder of a country already listed in data/countries.json.
 *   npm run new-country bj
 * It writes an empty operators.json, the only file the app needs to start reading a country,
 * and prints the next steps. It never invents an entry: data comes from sources, with a date.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Read and write from the repository, whatever directory the command was typed in.
process.chdir(fileURLToPath(new URL('..', import.meta.url)));

const ROOT = 'data';
const COUNTRIES = join(ROOT, 'countries.json');
const FLAG_URL = 'https://cdn.jsdelivr.net/gh/HatScripts/circle-flags/flags';

const code = (process.argv[2] ?? '').trim().toLowerCase();
if (!code) fail('Usage: npm run new-country <country code>, for example: npm run new-country bj');

const countries = JSON.parse(readFileSync(COUNTRIES, 'utf8')).countries;
const country = countries.find((c) => c.code === code);
if (!country) fail(`${code} is not in ${COUNTRIES}. Add it there first, with its name, dial_code, national_length, currency, amount_label and amount_presets, keeping "status": "soon".`);

const folder = join(ROOT, code);
const operators = join(folder, 'operators.json');
if (existsSync(operators)) fail(`${operators} already exists. Edit it instead of scaffolding it again.`);

mkdirSync(folder, { recursive: true });
writeFileSync(operators, `${JSON.stringify({ country: code, operators: [] }, null, 2)}\n`);

console.log(`Created ${operators}`);
console.log(`
Next steps, in this order:

1. ${operators}: one object per operator, with its mobile money service, its
   customer service number, its website, and a provenance block (a source and a
   date). See docs/data-schema.md#operatorsjson.
2. data/${code}/<operator id>/<category>.json: one file per category, copied in
   shape from data/tg/. Every entry needs its provenance. See docs/adding-a-country.md.
3. public/flags/${code}.svg: download it from
   ${FLAG_URL}/${code}.svg
4. npm run verify: types, data checks and build. Every file of the country is
   checked as soon as it exists, so you can iterate long before going live.
5. Switch the country to "live" in ${COUNTRIES} in the same pull request that
   brings its data.
`);
console.log(`Country: ${country.name} (+${country.dial_code}), amounts in ${country.amount_label}, status: ${country.status}`);

function fail(message) {
  console.error(message);
  process.exit(1);
}
