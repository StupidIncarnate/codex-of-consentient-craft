import { exitCodeStatics } from './exit-code-statics';

describe('exitCodeStatics', () => {
  it('VALID: limits.max => returns 255', () => {
    const result = exitCodeStatics.limits.max;

    expect(result).toBe(255);
  });
});
