import { rateLimitsHistoryLineContract } from './rate-limits-history-line-contract';
import { RateLimitsHistoryLineStub } from './rate-limits-history-line.stub';

describe('rateLimitsHistoryLineContract', () => {
  describe('valid lines', () => {
    it('VALID: full line => parses successfully', () => {
      const result = rateLimitsHistoryLineContract.parse(RateLimitsHistoryLineStub());

      expect(result).toStrictEqual({
        at: '2026-05-05T13:00:00.000Z',
        fiveHour: { usedPercentage: 42, resetsAt: '2026-05-05T15:00:00.000Z' },
        sevenDay: { usedPercentage: 20, resetsAt: '2026-05-05T15:00:00.000Z' },
      });
    });

    it('VALID: {fiveHour: null, sevenDay: null} => parses with both windows null', () => {
      const result = rateLimitsHistoryLineContract.parse(
        RateLimitsHistoryLineStub({ fiveHour: null, sevenDay: null }),
      );

      expect(result).toStrictEqual({
        at: '2026-05-05T13:00:00.000Z',
        fiveHour: null,
        sevenDay: null,
      });
    });
  });

  describe('invalid lines', () => {
    it('INVALID: {at: not-a-timestamp} => throws validation error', () => {
      expect(() => {
        rateLimitsHistoryLineContract.parse({
          at: 'not-a-timestamp',
          fiveHour: null,
          sevenDay: null,
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        rateLimitsHistoryLineContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
