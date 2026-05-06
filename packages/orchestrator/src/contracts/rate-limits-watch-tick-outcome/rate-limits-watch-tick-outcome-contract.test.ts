import { rateLimitsWatchTickOutcomeContract } from './rate-limits-watch-tick-outcome-contract';
import { RateLimitsWatchTickOutcomeStub } from './rate-limits-watch-tick-outcome.stub';

describe('rateLimitsWatchTickOutcomeContract', () => {
  it('VALID: {default} => uses default "changed"', () => {
    expect(RateLimitsWatchTickOutcomeStub()).toBe('changed');
  });

  it.each(['changed', 'unchanged', 'cleared', 'error'] as const)(
    'VALID: {value: %s} => parses successfully',
    (outcome) => {
      expect(rateLimitsWatchTickOutcomeContract.parse(outcome)).toBe(outcome);
    },
  );

  it('INVALID: {value: "unknown"} => throws validation error', () => {
    expect(() => rateLimitsWatchTickOutcomeContract.parse('unknown')).toThrow(
      /Invalid enum value/u,
    );
  });
});
