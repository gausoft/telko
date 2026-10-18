import type { Param, Ussd } from './schema';
import type { BuiltCode, CodeToken, PhoneContext, Step, Validation } from './ussd-flow-types';

const PLACEHOLDER = /\{([a-z_]+)\}/g;

const DEFAULT_SHORT: Record<Param['type'], string> = {
  phone: 'Numéro',
  amount: 'Montant',
  pin: 'Code',
  text: 'Saisie',
  choice: 'Choix',
};

export const DEFAULT_PRESETS = [500, 1000, 2000, 5000];

/** Splits a code into fixed text and boxes; secret boxes are never filled. */
export function codeTokens(ussd: Ussd, values: Record<string, string> = {}): CodeToken[] {
  const tokens: CodeToken[] = [];
  let last = 0;

  for (const match of ussd.template.matchAll(PLACEHOLDER)) {
    const name = match[1] ?? '';
    const param = paramOf(ussd, name);
    if (match.index > last) tokens.push({ kind: 'text', text: ussd.template.slice(last, match.index) });

    const secret = param.type === 'pin';
    tokens.push({ kind: 'slot', name, short: shortOf(param), value: secret ? null : (values[name] ?? null), secret });
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

function shortOf(param: Param): string {
  return param.short ?? DEFAULT_SHORT[param.type];
}

/** The tokens actually dialed: up to the first secret code, closed with "#". */
export function dialTokens(ussd: Ussd, values: Record<string, string>): CodeToken[] {
  const tokens = codeTokens(ussd, values);
  const cut = tokens.findIndex((t) => t.kind === 'slot' && t.secret);
  if (cut === -1) return tokens;

  const kept = tokens.slice(0, cut);
  const last = kept.at(-1);
  if (last?.kind === 'text') kept[kept.length - 1] = { kind: 'text', text: last.text.replace(/\*+$/, '') };

  return [...kept, { kind: 'text', text: '#' }];
}

/** Boxes to ask for: each once, in code order, stopping at the first secret code. */
export function planSteps(ussd: Ussd): Step[] {
  const steps: Step[] = [];

  for (const token of codeTokens(ussd)) {
    if (token.kind !== 'slot') continue;
    if (token.secret) break;
    if (steps.some((s) => s.name === token.name)) continue;
    steps.push({ ...paramOf(ussd, token.name), short: token.short });
  }

  return steps;
}

/**
 * The code to dial. When a secret code is needed, the code stops before it and is closed with "#":
 * the operator's menu then asks for the secret code itself. A trailing "*" would be dialed as a phone call.
 */
export function buildCode(ussd: Ussd, values: Record<string, string>): BuiltCode {
  let code = '';
  let complete = true;

  for (const token of codeTokens(ussd, values)) {
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
  if (format === 'any') return digits.length >= 6 ? { ok: true, value: digits } : { ok: false, message: 'Numéro trop court' };

  const national = digits.length === ctx.dialCode.length + ctx.nationalLength && digits.startsWith(ctx.dialCode) ? digits.slice(ctx.dialCode.length) : digits;
  if (national.length !== ctx.nationalLength) return { ok: false, message: `Le numéro doit avoir ${ctx.nationalLength} chiffres` };
  if (format === 'international') return { ok: true, value: `${ctx.dialCode}${national}` };
  if (ctx.dialCode !== ctx.homeDialCode) return { ok: false, message: 'Ce code accepte seulement les numéros du pays' };

  return { ok: true, value: national };
}

function validateAmount(step: Step, raw: string): Validation {
  const value = raw.replace(/\D/g, '').replace(/^0+/, '');
  const amount = Number(value);
  if (value === '' || amount <= 0) return { ok: false, message: 'Indiquez un montant' };
  if (step.min !== undefined && amount < step.min) return { ok: false, message: `Minimum ${step.min} F` };
  if (step.max !== undefined && amount > step.max) return { ok: false, message: `Maximum ${step.max} F` };

  return { ok: true, value };
}

function validateChoice(step: Step, raw: string): Validation {
  return step.options?.some((o) => o.value === raw) ? { ok: true, value: raw } : { ok: false, message: 'Choisissez une option' };
}

function validateText(step: Step, raw: string): Validation {
  const value = step.numeric ? raw.replace(/\D/g, '') : raw.trim();
  if (value === '') return { ok: false, message: 'Champ obligatoire' };
  if (/[*#]/.test(value)) return { ok: false, message: 'Les caractères * et # ne sont pas permis' };
  if (step.length !== undefined && value.length !== step.length) return { ok: false, message: `${step.length} caractères attendus` };

  return { ok: true, value };
}
