import { RateLimitWindowStub } from '../rate-limit-window/rate-limit-window.stub';
import { rateLimitsSnapshotContract } from './rate-limits-snapshot-contract';
import { RateLimitsSnapshotStub } from './rate-limits-snapshot.stub';

describe('rateLimitsSnapshotContract', () => {
  describe('valid snapshots', () => {
    it('VALID: full snapshot => parses successfully', () => {
      const result = rateLimitsSnapshotContract.parse(RateLimitsSnapshotStub());

      expect(result).toStrictEqual({
        fiveHour: { usedPercentage: 42, resetsAt: '2026-05-05T15:00:00.000Z' },
        sevenDay: { usedPercentage: 20, resetsAt: '2026-05-05T15:00:00.000Z' },
        updatedAt: '2026-05-05T13:00:00.000Z',
      });
    });

    it('VALID: {fiveHour: null, sevenDay: null} => parses successfully', () => {
      const result = rateLimitsSnapshotContract.parse(
        RateLimitsSnapshotStub({ fiveHour: null, sevenDay: null }),
      );

      expect(result).toStrictEqual({
        fiveHour: null,
        sevenDay: null,
        updatedAt: '2026-05-05T13:00:00.000Z',
      });
    });

    it('VALID: {fiveHour: window, sevenDay: null} => parses with one window', () => {
      const result = rateLimitsSnapshotContract.parse(
        RateLimitsSnapshotStub({
          fiveHour: RateLimitWindowStub({ usedPercentage: 81 }),
          sevenDay: null,
        }),
      );

      expect(result).toStrictEqual({
        fiveHour: { usedPercentage: 81, resetsAt: '2026-05-05T15:00:00.000Z' },
        sevenDay: null,
        updatedAt: '2026-05-05T13:00:00.000Z',
      });
    });
  });

  describe('invalid snapshots', () => {
    it('INVALID: {updatedAt: not-a-timestamp} => throws validation error', () => {
      expect(() => {
        rateLimitsSnapshotContract.parse({
          fiveHour: null,
          sevenDay: null,
          updatedAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        rateLimitsSnapshotContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {fiveHour: invalid window} => throws validation error', () => {
      expect(() => {
        rateLimitsSnapshotContract.parse({
          fiveHour: { usedPercentage: 200, resetsAt: '2026-05-05T15:00:00.000Z' },
          sevenDay: null,
          updatedAt: '2026-05-05T13:00:00.000Z',
        });
      }).toThrow(/too_big/u);
    });
  });
});
