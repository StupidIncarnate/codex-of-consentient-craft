import { wardTimeoutStatics } from './ward-timeout-statics';

describe('wardTimeoutStatics', () => {
  it('VALID: minimumTimeout => is 600000ms (10 minutes)', () => {
    expect(wardTimeoutStatics).toStrictEqual({
      minimumTimeout: 600_000,
    });
  });
});
