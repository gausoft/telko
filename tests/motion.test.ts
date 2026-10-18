import { describe, expect, it } from 'vitest';

import { depthOf, motionKind } from '../src/lib/motion';

describe('page motion', () => {
  it('measures depth without the language prefix', () => {
    expect(depthOf('/tg')).toBe(1);
    expect(depthOf('/en/tg')).toBe(1);
    expect(depthOf('/tg/recherche')).toBe(2);
    expect(depthOf('/en/tg/reglages')).toBe(2);
    expect(depthOf('/tg/yas/internet')).toBe(3);
    expect(depthOf('/bienvenue')).toBe(1);
    expect(depthOf('/')).toBe(0);
  });

  it('slides deeper pages in, shallower ones back, and fades the rest', () => {
    expect(motionKind(1, 3)).toBe('forward');
    expect(motionKind(3, 1)).toBe('back');
    expect(motionKind(3, 3)).toBe('same');
    expect(motionKind(null, 2)).toBe('same');
  });
});
