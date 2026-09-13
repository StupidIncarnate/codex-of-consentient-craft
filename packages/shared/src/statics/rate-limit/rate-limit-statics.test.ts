import { rateLimitStatics } from './rate-limit-statics';

describe('rateLimitStatics', () => {
  it('VALID: full statics => contains expected percent bounds and hold thresholds', () => {
    expect(rateLimitStatics).toStrictEqual({
      percent: {
        min: 0,
        max: 100,
      },
      windowLabels: {
        fiveHour: '5h',
        sevenDay: '7d',
      },
      hold: {
        thresholdPercentage: 90,
        rejectedWaitMs: 1_800_000,
      },
    });
  });
});
