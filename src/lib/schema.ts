import { z } from 'zod';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const PLACEHOLDER = /\{([a-z_]+)\}/g;

export const CATEGORIES = [
  'general', 'internet', 'mixed', 'voice-sms', 'weekend', 'roaming',
  'international', 'credit-transfer', 'mobile-money', 'bills', 'useful-numbers',
] as const;

export const FEE_OPERATIONS = [
  'withdrawal', 'deposit', 'receive', 'transfer-national', 'transfer-regional',
  'transfer-cross-network', 'transfer-bank', 'other',
] as const;

export const sourceSchema = z.object({
  url: z.url(),
  kind: z.enum(['official', 'device', 'secondary']),
  accessed: z.string().regex(ISO_DATE),
});

export const provenanceSchema = z
  .object({
    status: z.enum(['unverified', 'verified', 'stale', 'discontinued']),
    sources: z.array(sourceSchema).min(1),
    verified_at: z.string().regex(ISO_DATE).nullable(),
    verified_by: z.string().nullable(),
  })
  .refine((p) => p.status !== 'verified' || p.verified_at !== null, {
    message: 'verified entries need verified_at',
  });

/**
 * English text of an object whose own text is French, the source language. Every key is optional
 * (French shows instead) and unknown keys are refused, so a typo never hides a translation.
 */
function translation<S extends z.ZodRawShape>(shape: S) {
  return z.object(shape).partial().strict().optional();
}

export const PHONE_FORMATS = ['national', 'international', 'any'] as const;

export const paramSchema = z.object({
  name: z.string().regex(/^[a-z_]+$/),
  type: z.enum(['phone', 'amount', 'pin', 'text', 'choice']),
  label: z.string().min(1),
  required: z.boolean(),
  /** Few words shown inside the one-line code, e.g. "Matricule". Defaults by type. */
  short: z.string().min(1).max(12).optional(),
  /** phone: national number (default), with the country code, or digits as typed. */
  format: z.enum(PHONE_FORMATS).optional(),
  /** amount: bounds in the country currency and quick picks. */
  min: z.number().int().positive().optional(),
  max: z.number().int().positive().optional(),
  presets: z.array(z.number().int().positive()).max(6).optional(),
  /** text: exact length and digits-only keyboard. */
  length: z.number().int().positive().optional(),
  numeric: z.boolean().optional(),
  /** choice: allowed values. */
  options: z
    .array(z.object({ value: z.string().min(1), label: z.string().min(1), en: translation({ label: z.string().min(1) }) }))
    .min(2)
    .optional(),
  en: translation({ label: z.string().min(1), short: z.string().min(1).max(12) }),
});

export const ussdSchema = z
  .object({ template: z.string().min(1), params: z.array(paramSchema) })
  .refine((u) => !/[{}]/.test(u.template.replace(PLACEHOLDER, '')), {
    message: 'template braces must only wrap lowercase parameter names, e.g. {phone}',
  })
  .refine((u) => new Set(u.params.map((p) => p.name)).size === u.params.length, {
    message: 'parameter names must be unique',
  })
  .refine(
    (u) => {
      const placeholders = new Set(Array.from(u.template.matchAll(PLACEHOLDER), (m) => m[1]));
      const names = new Set(u.params.map((p) => p.name));

      return placeholders.size === names.size && [...placeholders].every((p) => names.has(p ?? ''));
    },
    { message: 'template placeholders must match params' },
  );

const amount = z.number().int().min(-1).nullable();

export const entrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(['bundle', 'service']),
  name: z.string().min(1),
  description: z.string(),
  /** In the currency of the country, written as `country.amount_label`. */
  price: z.number().int().nonnegative().nullable(),
  allowances: z.object({ data_mb: amount, voice_min: amount, sms: amount }).nullable(),
  validity: z.object({ days: z.number().int().nullable(), label: z.string(), en: translation({ label: z.string() }) }).nullable(),
  time_window: z.object({ from: z.string(), to: z.string() }).nullable(),
  ussd: ussdSchema,
  payment_methods: z.array(z.string().regex(/^[a-z0-9-]+$/)),
  third_party: ussdSchema.nullable(),
  tags: z.array(z.string()),
  provenance: provenanceSchema,
  notes: z.string().nullable(),
  en: translation({ name: z.string().min(1), description: z.string(), notes: z.string() }),
});

export const categoryFileSchema = z.object({
  operator: z.string(),
  category: z.enum(CATEGORIES),
  entries: z.array(entrySchema),
});

export const feeEntrySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    operation: z.enum(FEE_OPERATIONS),
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative().nullable(),
    fee: z.number().int().nonnegative().nullable(),
    fee_percent: z.number().min(0).max(100).nullable(),
    label: z.string().min(1),
    provenance: provenanceSchema,
    notes: z.string().nullable(),
    en: translation({ label: z.string().min(1), notes: z.string() }),
  })
  .refine((f) => f.max === null || f.max >= f.min, { message: 'max must be >= min' })
  .refine((f) => f.fee === null || f.fee_percent === null, { message: 'use either fee or fee_percent, not both' });

export const feesFileSchema = z.object({
  operator: z.string(),
  service: z.string(),
  entries: z.array(feeEntrySchema),
});

export const badgeSchema = z.object({
  label: z.string().min(1).max(3),
  background: z.string().regex(HEX_COLOR),
  foreground: z.string().regex(HEX_COLOR),
});

export const brandSchema = z.object({
  id: z.string(),
  name: z.string(),
  short_name: z.string(),
  former_names: z.array(z.string()),
  badge: badgeSchema,
  logo: z.string().nullable(),
});

export const operatorSchema = brandSchema.extend({
  mobile_money: brandSchema.nullable(),
  prefixes: z.array(z.string()),
  website: z.url(),
  /** Published service number, or null when the operator publishes none. */
  customer_service: z.string().nullable(),
  /** Where the operator name, its service number and its website come from. An official page is accepted. */
  provenance: provenanceSchema,
  notes: z.string().nullable(),
  en: translation({ notes: z.string() }),
});

export const operatorsFileSchema = z.object({
  country: z.string().length(2),
  operators: z.array(operatorSchema),
});

export const countrySchema = z.object({
  code: z.string().length(2),
  name: z.string(),
  status: z.enum(['live', 'soon']),
  dial_code: z.string().regex(/^\d+$/),
  /** Digits of a mobile number without the country code. */
  national_length: z.number().int().min(6).max(12),
  /** ISO 4217 code of the currency every amount of this country is written in. */
  currency: z.string().length(3),
  /** How an amount is written after the figure, as on the operator's receipts: "F", "GH₵", "KSh". */
  amount_label: z.string().min(1).max(4),
  /** Quick amounts offered by the code assistant, in the country currency. Empty means the app default. */
  amount_presets: z.array(z.number().int().positive()).max(6),
  en: translation({ name: z.string() }),
});

export const countriesFileSchema = z.object({ countries: z.array(countrySchema).min(1) });

export const featuredFileSchema = z.object({
  country: z.string().length(2),
  updated: z.string().regex(ISO_DATE),
  items: z.array(z.object({ entry_id: z.string(), label: z.string().min(1), en: translation({ label: z.string().min(1) }) })),
  shortcuts: z.array(
    z.object({
      entry_id: z.string(),
      label: z.string().min(1),
      brand: z.enum(['operator', 'mobile_money']),
      en: translation({ label: z.string().min(1) }),
    }),
  ),
});

export type Entry = z.infer<typeof entrySchema>;
export type Param = z.infer<typeof paramSchema>;
export type Ussd = z.infer<typeof ussdSchema>;
export type CategoryFile = z.infer<typeof categoryFileSchema>;
export type FeeEntry = z.infer<typeof feeEntrySchema>;
export type FeesFile = z.infer<typeof feesFileSchema>;
export type Badge = z.infer<typeof badgeSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type Operator = z.infer<typeof operatorSchema>;
export type Country = z.infer<typeof countrySchema>;
export type FeaturedFile = z.infer<typeof featuredFileSchema>;
export type Provenance = z.infer<typeof provenanceSchema>;
export type Category = (typeof CATEGORIES)[number];
