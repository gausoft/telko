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

export const paramSchema = z.object({
  name: z.string().regex(/^[a-z_]+$/),
  type: z.enum(['phone', 'amount', 'pin', 'text', 'choice']),
  label: z.string().min(1),
  required: z.boolean(),
});

export const ussdSchema = z
  .object({ template: z.string().min(1), params: z.array(paramSchema) })
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
  price_xof: z.number().int().nonnegative().nullable(),
  allowances: z.object({ data_mb: amount, voice_min: amount, sms: amount }).nullable(),
  validity: z.object({ days: z.number().int().nullable(), label: z.string() }).nullable(),
  time_window: z.object({ from: z.string(), to: z.string() }).nullable(),
  ussd: ussdSchema,
  payment_methods: z.array(z.enum(['airtime', 'mixx', 'flooz'])),
  third_party: ussdSchema.nullable(),
  tags: z.array(z.string()),
  provenance: provenanceSchema,
  notes: z.string().nullable(),
});

export const categoryFileSchema = z.object({
  operator: z.string(),
  category: z.enum(CATEGORIES),
  entries: z.array(entrySchema),
});

export const feeEntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  operation: z.enum(FEE_OPERATIONS),
  min_xof: z.number().int(),
  max_xof: z.number().int().nullable(),
  fee_xof: z.number().int().nullable(),
  fee_percent: z.number().nullable(),
  label: z.string(),
  provenance: provenanceSchema,
  notes: z.string().nullable(),
});

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
  customer_service: z.string(),
  notes: z.string().nullable(),
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
  currency: z.string().length(3),
});

export const countriesFileSchema = z.object({ countries: z.array(countrySchema).min(1) });

export const featuredFileSchema = z.object({
  country: z.string().length(2),
  updated: z.string().regex(ISO_DATE),
  items: z.array(z.object({ entry_id: z.string(), label: z.string().min(1) })),
});

export type Entry = z.infer<typeof entrySchema>;
export type CategoryFile = z.infer<typeof categoryFileSchema>;
export type FeeEntry = z.infer<typeof feeEntrySchema>;
export type FeesFile = z.infer<typeof feesFileSchema>;
export type Badge = z.infer<typeof badgeSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type Operator = z.infer<typeof operatorSchema>;
export type Country = z.infer<typeof countrySchema>;
export type FeaturedFile = z.infer<typeof featuredFileSchema>;
export type Category = (typeof CATEGORIES)[number];
