import { describe, expect, it } from 'vitest';

import { splitParts, withVariables } from '../src/lib/code-parts';

describe('code parts', () => {
  it('splits a plain code into digit groups', () => {
    expect(splitParts('*155*1*1*90123456*5000#')).toEqual(['155', '1', '1', '90123456', '5000']);
  });

  it('does not split other shapes', () => {
    for (const code of ['#150#', '*100*A1#', '*123', '*#06#']) expect(splitParts(code)).toBeNull();
  });

  it('replaces the parts the visitor named', () => {
    expect(withVariables('*155*1*1*90123456*5000#', ['fixed', 'fixed', 'fixed', 'phone', 'amount'])).toBe('*155*1*1*{phone}*{amount}#');
  });

  it('keeps a code that cannot be split', () => {
    expect(withVariables(' #150# ', ['phone'])).toBe('#150#');
  });
});
