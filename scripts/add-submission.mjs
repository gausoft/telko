/**
 * Turns one proposal message into an unverified data entry, ready to review.
 *   npm run add-submission -- message.txt
 *   pbpaste | npm run add-submission -- - --category internet
 * The message is the text the contribution endpoint sends. The entry is written as
 * "unverified" with the visitor's source: nothing is published as verified until someone
 * has tried the code on a real phone (docs/verification-protocol.md). The contact line is
 * never copied into the repository.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));

const PLACEHOLDER = /\{([a-z_]+)\}/g;
const PARAMS = {
  phone: { name: 'phone', type: 'phone', label: 'Numéro', required: true, format: 'any', en: { label: 'Number' } },
  amount: { name: 'amount', type: 'amount', label: 'Montant', required: true, en: { label: 'Amount' } },
};
const CATEGORY_BY_SERVICE = { 'mobile money': 'mobile-money', 'factures et autres services': 'general' };
const SOURCE_KIND = { 'Testé sur mon téléphone': 'device', "Site officiel de l'opérateur": 'official' };

const { file, category: forced } = readArguments(process.argv.slice(2));
const message = parseMessage(readFileSync(file === '-' ? 0 : file, 'utf8'));
const operator = findOperator(message);
const category = forced ?? CATEGORY_BY_SERVICE[message.service.toLowerCase()];
if (!category) fail(`"${message.service}" does not say which section the code belongs to. Add --category internet, mixed, voice-sms or general.`);

const entry = buildEntry(message, operator, category);
const path = join('data', message.country, operator.id, `${category}.json`);
const data = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { operator: operator.id, category, entries: [] };
if (data.entries.some((e) => e.id === entry.id)) fail(`${entry.id} already exists in ${path}.`);

data.entries.push(entry);
mkdirSync(join('data', message.country, operator.id), { recursive: true });
writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);

console.log(`Added ${entry.id} to ${path} as unverified.`);
console.log(`
Next steps:
1. Fill what the message could not give: price, allowances and validity if it is an offer.
2. Add the English text under "en" (name and description): the translation test fails without it.
3. Try the code on a real phone, then follow docs/verification-protocol.md to mark it verified.
4. npm test, then a pull request.`);

function readArguments(args) {
  const category = args.includes('--category') ? args[args.indexOf('--category') + 1] : undefined;
  const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--category');
  if (!file) fail('Usage: npm run add-submission -- <message file | -> [--category internet|mixed|voice-sms|general]');

  return { file, category };
}

/** Reads the labelled lines of the endpoint message. */
function parseMessage(text) {
  const lines = text.split('\n').map((l) => l.trim());
  const field = (label) => lines.find((l) => l.startsWith(`${label} : `))?.slice(label.length + 3) ?? '';
  const head = lines.find((l) => /\([a-z]{2}\)$/.test(l)) ?? '';
  const [label, service] = head.replace(/\s*\([a-z]{2}\)$/, '').split(/,\s*(.*)/s);
  const message = {
    country: head.match(/\(([a-z]{2})\)$/)?.[1] ?? '',
    operatorLabel: label ?? '',
    service: service ?? '',
    name: field('Nom'),
    code: field('Code'),
    details: field('Détails'),
    proof: field('Preuve'),
    source: field('Source'),
    date: field('Date').split('/').reverse().join('-'),
  };
  const missing = ['country', 'operatorLabel', 'name', 'code', 'date'].filter((k) => !message[k]);
  if (missing.length > 0) fail(`The message is incomplete or not from the endpoint: missing ${missing.join(', ')}.`);

  return message;
}

function findOperator(message) {
  const path = join('data', message.country, 'operators.json');
  if (!existsSync(path)) fail(`No data folder for "${message.country}".`);

  const label = message.operatorLabel.toLowerCase();
  const found = JSON.parse(readFileSync(path, 'utf8')).operators.find((o) => label.startsWith(o.short_name.toLowerCase()));
  if (!found) fail(`No operator of ${path} matches "${message.operatorLabel}".`);

  return found;
}

function buildEntry(message, operator, category) {
  const names = [...message.code.matchAll(PLACEHOLDER)].map((m) => m[1]);
  const unknown = names.filter((n) => !(n in PARAMS));
  if (unknown.length > 0) fail(`Variable {${unknown[0]}} is not supported here (a secret code is never stored). Edit the entry by hand.`);

  return {
    id: `${operator.id}-${category}-${slug(message.name)}`,
    kind: 'service',
    name: message.name,
    description: message.details,
    price: null,
    allowances: null,
    validity: null,
    time_window: null,
    ussd: { template: message.code, params: [...new Set(names)].map((n) => PARAMS[n]) },
    payment_methods: [],
    third_party: null,
    tags: [],
    provenance: {
      status: 'unverified',
      sources: [{ url: message.source || operator.website, kind: message.source ? (SOURCE_KIND[message.proof] ?? 'secondary') : 'device', accessed: message.date }],
      verified_at: null,
      verified_by: null,
    },
    notes: null,
  };
}

function slug(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function fail(text) {
  console.error(text);
  process.exit(1);
}
