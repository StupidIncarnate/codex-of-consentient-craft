import { apiOverloadRetryStatics } from './api-overload-retry-statics';

describe('apiOverloadRetryStatics', () => {
  it('VALID: {exported value} => matches the two-tier schedule and overload markers', () => {
    expect(apiOverloadRetryStatics).toStrictEqual({
      fastAttempts: 10,
      fastDelayMs: 60_000,
      slowAttempts: 20,
      slowDelayMs: 300_000,
      markers: ['API Error: 529', '529 Overloaded', 'overloaded_error'],
    });
  });

  it('VALID: {fast tier + slow tier} => spans a 110 minute retry window', () => {
    const totalMs =
      apiOverloadRetryStatics.fastAttempts * apiOverloadRetryStatics.fastDelayMs +
      apiOverloadRetryStatics.slowAttempts * apiOverloadRetryStatics.slowDelayMs;

    expect(totalMs).toBe(6_600_000);
  });
});
