import { UsageBucketStub, WeightedTokensStub } from '@dungeonmaster/shared/contracts';

import { usageWindowRecoveryAtTransformer } from './usage-window-recovery-at-transformer';

const HOUR = 3_600_000;
const FIVE_HOURS = 18_000_000;
const NOW = Date.parse('2026-09-13T05:00:00.000Z');
// A ceiling of 1000 puts the 90% hold threshold at 900 weighted tokens.
const CEILING = WeightedTokensStub({ value: 1_000 });

describe('usageWindowRecoveryAtTransformer', () => {
  describe('already below the threshold', () => {
    it('VALID: {an empty window} => returns now', () => {
      const result = usageWindowRecoveryAtTransformer({
        buckets: {},
        windowMs: FIVE_HOURS,
        ceiling: CEILING,
        nowMs: NOW,
      });

      expect(result).toBe('2026-09-13T05:00:00.000Z');
    });

    it('EDGE: {spend just under the threshold} => returns now', () => {
      const result = usageWindowRecoveryAtTransformer({
        // 179 output tokens weight to 895, just under 900.
        buckets: {
          [String(NOW - HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 179,
          }),
        },
        windowMs: FIVE_HOURS,
        ceiling: CEILING,
        nowMs: NOW,
      });

      expect(result).toBe('2026-09-13T05:00:00.000Z');
    });
  });

  describe('over the threshold', () => {
    it('VALID: {one hour holds all the spend} => recovers when that hour ages out', () => {
      const result = usageWindowRecoveryAtTransformer({
        // 200 output tokens weight to 1000, over the 900 threshold.
        buckets: {
          [String(NOW - HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 200,
          }),
        },
        windowMs: FIVE_HOURS,
        ceiling: CEILING,
        nowMs: NOW,
      });

      // That bucket started 1h ago; it leaves the 5h window 5h after its start, plus the hour it
      // spans — so 4h from now, plus one hour.
      expect(result).toBe(new Date(NOW - HOUR + FIVE_HOURS + HOUR).toISOString());
    });

    it('VALID: {spend split across two hours} => recovers as soon as dropping the OLDER one is enough', () => {
      const result = usageWindowRecoveryAtTransformer({
        buckets: {
          // 150 output = 750 weighted, the older hour.
          [String(NOW - 3 * HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 150,
          }),
          // 100 output = 500 weighted. Total 1250, over 900; without the older one, 500 is under.
          [String(NOW - HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 100,
          }),
        },
        windowMs: FIVE_HOURS,
        ceiling: CEILING,
        nowMs: NOW,
      });

      expect(result).toBe(new Date(NOW - 3 * HOUR + FIVE_HOURS + HOUR).toISOString());
    });

    it('VALID: {the newest hour alone exceeds the threshold} => waits for that one to age out', () => {
      const result = usageWindowRecoveryAtTransformer({
        buckets: {
          [String(NOW - 4 * HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 100,
          }),
          // 1000 weighted on its own, so dropping the older hour changes nothing.
          [String(NOW - HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 200,
          }),
        },
        windowMs: FIVE_HOURS,
        ceiling: CEILING,
        nowMs: NOW,
      });

      expect(result).toBe(new Date(NOW - HOUR + FIVE_HOURS + HOUR).toISOString());
    });
  });

  describe('spend outside the window', () => {
    it('EDGE: {all spend older than the window} => returns now, because none of it counts', () => {
      const result = usageWindowRecoveryAtTransformer({
        buckets: {
          [String(NOW - 10 * HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 10_000,
          }),
        },
        windowMs: FIVE_HOURS,
        ceiling: CEILING,
        nowMs: NOW,
      });

      expect(result).toBe('2026-09-13T05:00:00.000Z');
    });
  });
});
