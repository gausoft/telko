import type { Category, Entry, Provenance } from './schema';

const DAY_MS = 86_400_000;

/** Re-verification windows from docs/verification-protocol.md, in days. */
const WINDOW_DAYS: Record<Category, number> = {
  'mobile-money': 90,
  'credit-transfer': 90,
  bills: 90,
  internet: 60,
  mixed: 60,
  'voice-sms': 60,
  weekend: 60,
  general: 180,
  'useful-numbers': 180,
  roaming: 180,
  international: 180,
};

/** Categories where money moves: only a device test counts as proof. */
const DEVICE_ONLY: ReadonlySet<Category> = new Set(['mobile-money', 'credit-transfer', 'bills']);

export function effectiveStatus(provenance: Entry['provenance'], category: Category, now: Date): Entry['provenance']['status'] {
  if (provenance.status !== 'verified' || provenance.verified_at === null) return provenance.status;

  const age = (now.getTime() - Date.parse(`${provenance.verified_at}T00:00:00Z`)) / DAY_MS;

  return age > WINDOW_DAYS[category] ? 'stale' : 'verified';
}

export function assertVerificationProof(path: string, entry: Entry, category: Category): void {
  if (entry.provenance.status !== 'verified') return;

  if (!hasAcceptedProof(entry.provenance, DEVICE_ONLY.has(category))) {
    throw new Error(`${path}: "${entry.id}" is verified without an accepted proof (see docs/verification-protocol.md)`);
  }
}

/** A device test always counts; an official page counts everywhere except where money moves. */
export function hasAcceptedProof(provenance: Provenance, deviceOnly: boolean): boolean {
  const kinds = new Set(provenance.sources.map((s) => s.kind));

  return deviceOnly ? kinds.has('device') : kinds.has('device') || kinds.has('official');
}

/**
 * The day a set of sources was last read, as an ISO date, or null when there is none. Dates are
 * ISO, so the lexicographic maximum is the latest one.
 */
export function lastReadOn(provenances: readonly Provenance[]): string | null {
  const days = provenances.flatMap((provenance) => provenance.sources.map((source) => source.accessed));

  return days.length === 0 ? null : days.reduce((latest, day) => (day > latest ? day : latest));
}
