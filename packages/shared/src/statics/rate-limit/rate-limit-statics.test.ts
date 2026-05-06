import { rateLimitStatics } from './rate-limit-statics';

describe('rateLimitStatics', () => {
  it('VALID: full statics => contains expected percent bounds', () => {
    expect(rateLimitStatics).toStrictEqual({
      percent: {
        min: 0,
        max: 100,
      },
    });
  });
});
