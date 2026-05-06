import { rateLimitsThrottleStatics } from './rate-limits-throttle-statics';

describe('rateLimitsThrottleStatics', () => {
  it('VALID: exported value => 5000ms throttle interval', () => {
    expect(rateLimitsThrottleStatics).toStrictEqual({ minIntervalMs: 5000 });
  });
});
