import { rateLimitRejectionStatics } from './rate-limit-rejection-statics';

describe('rateLimitRejectionStatics', () => {
  it('VALID: full statics => contains the refusal markers and the window mapping', () => {
    expect(rateLimitRejectionStatics).toStrictEqual({
      markers: [
        'API Error: 429',
        'rate_limit_error',
        '"error":"rate_limit"',
        'hit your weekly limit',
        'hit your 5-hour limit',
      ],
      windowMarkers: {
        sevenDay: 'weekly limit',
        fiveHour: '5-hour limit',
      },
    });
  });
});
