import type { Param, Ussd } from './schema';
import type { BuiltCode, CodeToken, PhoneContext, ShortLabels, Step, Validation } from './ussd-flow-types';

const PLACEHOLDER = /\{([a-z_]+)\}/g;

/** Splits a code into fixed text and boxes; secret boxes are never filled. `shorts` names boxes without their own label. */
export function codeTokens(ussd: Ussd, shorts: ShortLabels, values: Record<string, string> = {}): CodeToken[] {
  const tokens: CodeToken[] = [];
  let last = 0;

  for (const match of ussd.template.matchAll(PLACEHOLDER)) {
    const name = match[1] ?? '';
    const param = paramOf(ussd, name);
    if (match.index > last) tokens.push({ kind: 'text', text: ussd.template.slice(last, match.index) });

    const secret = param.type === 'pin';
    tokens.push({ kind: 'slot', name, short: param.short ?? shorts[param.type], value: secret ? null : (values[name] ?? null), secret });
    last = match.index + match[0].length;
  }

  if (last < ussd.template.length) tokens.push({ kind: 'text', text: ussd.template.slice(last) });

  return tokens;
}

function paramOf(ussd: Ussd, name: string): Param {
  const param = ussd.params.find((p) => p.name === name);
  if (!param) throw new Error(`Unknown placeholder {${name}} in ${ussd.template}`);

  return param;
}

/** The tokens actually dialed: up to the first secret code, closed with "#". */
export function dialTokens(ussd: Ussd, shorts: ShortLabels, values: Record<string, string>): CodeToken[] {
  const tokens = codeTokens(ussd, shorts, values);
  const cut = tokens.findIndex((t) => t.kind === 'slot' && t.secret);
  if (cut === -1) return tokens;

  const kept = tokens.slice(0, cut);
  const last = kept.at(-1);
  if (last?.kind === 'text') kept[kept.length - 1] = { kind: 'text', text: last.text.replace(/\*+$/, '') };

  return [...kept, { kind: 'text', text: '#' }];
}

/** Boxes to ask for: each once, in code order, stopping at the first secret code. */
export function planSteps(ussd: Ussd, shorts: ShortLabels): Step[] {
  const steps: Step[] = [];

  for (const token of codeTokens(ussd, shorts)) {
    if (token.kind !== 'slot') continue;
    if (token.secret) break;
    if (steps.some((s) => s.name === token.name)) continue;
    steps.push({ ...paramOf(ussd, token.name), short: token.short });
  }

  return steps;
}

/** Box names do not matter when only the dialed code is built. */
const NO_SHORTS: ShortLabels = { phone: '', amount: '', pin: '', text: '', choice: '' };

/**
 * The code to dial. When a secret code is needed, the code stops before it and is closed with "#":
 * the operator's menu then asks for the secret code itself. A trailing "*" would be dialed as a phone call.
 */
export function buildCode(ussd: Ussd, values: Record<string, string>): BuiltCode {
  let code = '';
  let complete = true;

  for (const token of codeTokens(ussd, NO_SHORTS, values)) {
    if (token.kind === 'text') {
      code += token.text;
      continue;
    }
    if (token.secret) return { code: `${code.replace(/\*+$/, '')}#`, needsSecret: true, complete };
    if (token.value === null || token.value === '') complete = false;
    code += token.value ?? '';
  }

  return { code, needsSecret: false, complete };
}

export function validateStep(step: Step, raw: string, phone: PhoneContext): Validation {
  if (step.type === 'phone') return normalizePhone(raw, step.format ?? 'national', phone);
  if (step.type === 'amount') return validateAmount(step, raw);
  if (step.type === 'choice') return validateChoice(step, raw);

  return validateText(step, raw);
}

/** Accepts "+228 90 00 00 00", "0022890000000" or "90000000" and returns what the code expects. */
export function normalizePhone(raw: string, format: NonNullable<Param['format']>, ctx: PhoneContext): Validation {
  const digits = raw.replace(/\D/g, '').replace(/^00/, '');
  if (format === 'any') return digits.length >= 6 ? { ok: true, value: digits } : { ok: false, error: { code: 'phone-short' } };

  const national = digits.length === ctx.dialCode.length + ctx.nationalLength && digits.startsWith(ctx.dialCode) ? digits.slice(ctx.dialCode.length) : digits;
  if (national.length !== ctx.nationalLength) return { ok: false, error: { code: 'phone-length', n: ctx.nationalLength } };
  if (format === 'international') return { ok: true, value: `${ctx.dialCode}${national}` };
  if (ctx.dialCode !== ctx.homeDialCode) return { ok: false, error: { code: 'phone-country' } };

  return { ok: true, value: national };
}

const WHOLE_AMOUNT = /^\d{1,3}(?:[ \u00a0\u202f.]\d{3})+$|^\d+$/;

/** Whole CFA francs only, with optional thousands separators ("5 000", "5.000"). Anything else is refused, never repaired. */
function validateAmount(step: Step, raw: string): Validation {
  const trimmed = raw.trim();
  if (!WHOLE_AMOUNT.test(trimmed)) return { ok: false, error: { code: trimmed === '' ? 'amount-empty' : 'amount-format' } };

  const amount = Number(trimmed.replace(/\D/g, ''));
  const value = String(amount);
  if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, error: { code: 'amount-empty' } };
  if (step.min !== undefined && amount < step.min) return { ok: false, error: { code: 'amount-min', n: step.min } };
  if (step.max !== undefined && amount > step.max) return { ok: false, error: { code: 'amount-max', n: step.max } };

  return { ok: true, value };
}

function validateChoice(step: Step, raw: string): Validation {
  return step.options?.some((o) => o.value === raw) ? { ok: true, value: raw } : { ok: false, error: { code: 'choice' } };
}

function validateText(step: Step, raw: string): Validation {
  const trimmed = raw.trim();
  if (/[*#]/.test(trimmed)) return { ok: false, error: { code: 'text-chars' } };
  if (step.numeric && /[^\d\s]/.test(trimmed)) return { ok: false, error: { code: 'text-digits' } };

  const value = step.numeric ? trimmed.replace(/\s/g, '') : trimmed;
  if (value === '') return { ok: false, error: { code: 'text-empty' } };
  if (step.length !== undefined && value.length !== step.length) return { ok: false, error: { code: 'text-length', n: step.length } };

  return { ok: true, value };
}
