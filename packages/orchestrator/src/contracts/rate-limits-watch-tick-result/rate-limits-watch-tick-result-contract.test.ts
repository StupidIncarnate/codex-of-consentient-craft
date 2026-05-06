import { rateLimitsWatchTickResultContract } from './rate-limits-watch-tick-result-contract';
import { RateLimitsWatchTickResultStub } from './rate-limits-watch-tick-result.stub';

describe('rateLimitsWatchTickResultContract', () => {
  it('VALID: full result => parses successfully', () => {
    expect(rateLimitsWatchTickResultContract.parse(RateLimitsWatchTickResultStub())).toStrictEqual({
      outcome: 'changed',
      lastJson: '{"x":1}',
    });
  });

  it('VALID: {outcome: cleared, lastJson: null} => parses', () => {
    expect(
      rateLimitsWatchTickResultContract.parse(
        RateLimitsWatchTickResultStub({ outcome: 'cleared', lastJson: null }),
      ),
    ).toStrictEqual({
      outcome: 'cleared',
      lastJson: null,
    });
  });

  it('INVALID: {outcome: "bogus"} => throws', () => {
    expect(() =>
      rateLimitsWatchTickResultContract.parse({ outcome: 'bogus', lastJson: null }),
    ).toThrow(/Invalid enum value/u);
  });
});
