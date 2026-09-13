import { RateLimitWindowStub, RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';
import { rateLimitStatics } from '@dungeonmaster/shared/statics';

import { rateLimitsSnapshotToHoldTransformer } from './rate-limits-snapshot-to-hold-transformer';

const NOW_MS = Date.parse('2026-09-13T04:49:29.242Z');
const THRESHOLD = rateLimitStatics.hold.thresholdPercentage;

describe('rateLimitsSnapshotToHoldTransformer', () => {
  describe('below the threshold', () => {
    it('VALID: {both windows well under} => returns null', () => {
      const result = rateLimitsSnapshotToHoldTransformer({
        snapshot: RateLimitsSnapshotStub(),
        nowMs: NOW_MS,
      });

      expect(result).toBe(null);
    });

    it('EDGE: {sevenDay one point under the threshold} => returns null', () => {
      const result = rateLimitsSnapshotToHoldTransformer({
        snapshot: RateLimitsSnapshotStub({
          sevenDay: RateLimitWindowStub({ usedPercentage: THRESHOLD - 1 }),
        }),
        nowMs: NOW_MS,
      });

      expect(result).toBe(null);
    });

    it('EDGE: {fiveHour one point under the threshold} => returns null', () => {
      const result = rateLimitsSnapshotToHoldTransformer({
        snapshot: RateLimitsSnapshotStub({
          fiveHour: RateLimitWindowStub({ usedPercentage: THRESHOLD - 1 }),
        }),
        nowMs: NOW_MS,
      });

      expect(result).toBe(null);
    });
  });

  describe('at or over the threshold', () => {
    it('EDGE: {sevenDay exactly at the threshold} => holds, because the gate is inclusive', () => {
      const result = rateLimitsSnapshotToHoldTransformer({
        snapshot: RateLimitsSnapshotStub({
          sevenDay: RateLimitWindowStub({
            usedPercentage: THRESHOLD,
            resetsAt: '2026-09-20T06:00:00.000Z',
          }),
        }),
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 90% — dispatch holds until it resets',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-20T06:00:00.000Z',
      });
    });

    it('VALID: {fiveHour over, sevenDay under} => holds on the five-hour window and its own reset', () => {
      const result = rateLimitsSnapshotToHoldTransformer({
        snapshot: RateLimitsSnapshotStub({
          fiveHour: RateLimitWindowStub({
            usedPercentage: 97,
            resetsAt: '2026-09-13T08:00:00.000Z',
          }),
          sevenDay: RateLimitWindowStub({ usedPercentage: 31 }),
        }),
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        reason: 'approaching-limit',
        window: 'five-hour',
        detail: '5h window at 97% — dispatch holds until it resets',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-13T08:00:00.000Z',
      });
    });

    it('VALID: {both windows over} => holds on seven-day, whose later reset clears both', () => {
      const result = rateLimitsSnapshotToHoldTransformer({
        snapshot: RateLimitsSnapshotStub({
          fiveHour: RateLimitWindowStub({
            usedPercentage: 99,
            resetsAt: '2026-09-13T08:00:00.000Z',
          }),
          sevenDay: RateLimitWindowStub({
            usedPercentage: 93,
            resetsAt: '2026-09-20T06:00:00.000Z',
          }),
        }),
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93% — dispatch holds until it resets',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-20T06:00:00.000Z',
      });
    });

    it('EDGE: {sevenDay at 100} => holds, carrying the spent reading verbatim', () => {
      const result = rateLimitsSnapshotToHoldTransformer({
        snapshot: RateLimitsSnapshotStub({
          sevenDay: RateLimitWindowStub({
            usedPercentage: 100,
            resetsAt: '2026-09-20T06:00:00.000Z',
          }),
        }),
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 100% — dispatch holds until it resets',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-20T06:00:00.000Z',
      });
    });
  });

  describe('missing readings', () => {
    it('EMPTY: {snapshot: null} => returns null, so an absent tap never stops the queue', () => {
      const result = rateLimitsSnapshotToHoldTransformer({ snapshot: null, nowMs: NOW_MS });

      expect(result).toBe(null);
    });

    it('EMPTY: {both windows null} => returns null', () => {
      const result = rateLimitsSnapshotToHoldTransformer({
        snapshot: RateLimitsSnapshotStub({ fiveHour: null, sevenDay: null }),
        nowMs: NOW_MS,
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {sevenDay null, fiveHour over} => still holds on the window it can read', () => {
      const result = rateLimitsSnapshotToHoldTransformer({
        snapshot: RateLimitsSnapshotStub({
          sevenDay: null,
          fiveHour: RateLimitWindowStub({
            usedPercentage: 94,
            resetsAt: '2026-09-13T08:00:00.000Z',
          }),
        }),
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        reason: 'approaching-limit',
        window: 'five-hour',
        detail: '5h window at 94% — dispatch holds until it resets',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-13T08:00:00.000Z',
      });
    });

    it('EMPTY: {fiveHour null, sevenDay over} => still holds on the window it can read', () => {
      const result = rateLimitsSnapshotToHoldTransformer({
        snapshot: RateLimitsSnapshotStub({
          fiveHour: null,
          sevenDay: RateLimitWindowStub({
            usedPercentage: 91,
            resetsAt: '2026-09-20T06:00:00.000Z',
          }),
        }),
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 91% — dispatch holds until it resets',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-20T06:00:00.000Z',
      });
    });
  });
});
