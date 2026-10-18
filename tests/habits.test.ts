import { describe, expect, it } from 'vitest';

import { rankHabits } from '../src/lib/habits';

const DAY = 86_400_000;
const now = 100 * DAY;

describe('rankHabits', () => {
  it('puts the most used code first', () => {
    const rows = [
      { entryId: 'a', count: 2, lastUsedAt: now },
      { entryId: 'b', count: 9, lastUsedAt: now },
    ];

    expect(rankHabits(rows, now)).toEqual(['b', 'a']);
  });

  it('lets a recent habit beat an old one', () => {
    const rows = [
      { entryId: 'old', count: 10, lastUsedAt: now - 60 * DAY },
      { entryId: 'new', count: 3, lastUsedAt: now - DAY },
    ];

    expect(rankHabits(rows, now)[0]).toBe('new');
  });

  it('breaks ties with the latest use', () => {
    const rows = [
      { entryId: 'a', count: 1, lastUsedAt: now },
      { entryId: 'b', count: 1, lastUsedAt: now },
      { entryId: 'c', count: 2, lastUsedAt: now - 14 * DAY },
    ];

    expect(rankHabits(rows, now)).toEqual(['a', 'b', 'c']);
  });

  it('keeps at most the limit', () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({ entryId: String(i), count: i + 1, lastUsedAt: now }));

    expect(rankHabits(rows, now)).toEqual(['5', '4', '3']);
  });
});
