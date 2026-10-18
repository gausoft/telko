import type { HabitInput } from './habits-types';

const HALF_LIFE_DAYS = 14;
const DAY_MS = 86_400_000;

/**
 * Ranks codes by use, recent uses weighing more: a use loses half its weight every
 * two weeks. Ties go to the most recent. Returns entry ids, best first.
 */
export function rankHabits(rows: HabitInput[], now: number, limit = 3): string[] {
  return rows
    .map((row) => ({ row, score: row.count * 0.5 ** ((now - row.lastUsedAt) / DAY_MS / HALF_LIFE_DAYS) }))
    .sort((a, b) => b.score - a.score || b.row.lastUsedAt - a.row.lastUsedAt)
    .slice(0, limit)
    .map(({ row }) => row.entryId);
}
