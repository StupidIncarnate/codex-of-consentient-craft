import { UsageBucketStub } from '@dungeonmaster/shared/contracts';

import { usageBucketsToWeightedTotalTransformer } from './usage-buckets-to-weighted-total-transformer';

const HOUR = 3_600_000;
const NOW = Date.parse('2026-09-13T05:00:00.000Z');

describe('usageBucketsToWeightedTotalTransformer', () => {
  describe('weighting', () => {
    it('VALID: {one bucket of each token kind} => applies 1x, 1.25x, 0.1x and 5x', () => {
      const result = usageBucketsToWeightedTotalTransformer({
        buckets: {
          [String(NOW - HOUR)]: UsageBucketStub({
            input: 100,
            cacheCreation: 100,
            cacheRead: 100,
            output: 100,
          }),
        },
        windowStartMs: NOW - 5 * HOUR,
        nowMs: NOW,
      });

      // 100 + 125 + 10 + 500
      expect(result).toBe(735);
    });

    it('VALID: {two buckets in window} => sums them', () => {
      const result = usageBucketsToWeightedTotalTransformer({
        buckets: {
          [String(NOW - HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 10,
          }),
          [String(NOW - 2 * HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 4,
          }),
        },
        windowStartMs: NOW - 5 * HOUR,
        nowMs: NOW,
      });

      expect(result).toBe(70);
    });

    it('EMPTY: {no buckets} => returns 0', () => {
      expect(
        usageBucketsToWeightedTotalTransformer({
          buckets: {},
          windowStartMs: NOW - 5 * HOUR,
          nowMs: NOW,
        }),
      ).toBe(0);
    });
  });

  describe('window edges', () => {
    it('EDGE: {a bucket starting exactly at the window start} => is counted', () => {
      const result = usageBucketsToWeightedTotalTransformer({
        buckets: {
          [String(NOW - 5 * HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 1,
          }),
        },
        windowStartMs: NOW - 5 * HOUR,
        nowMs: NOW,
      });

      expect(result).toBe(5);
    });

    it('EDGE: {a bucket one hour before the window} => is excluded', () => {
      const result = usageBucketsToWeightedTotalTransformer({
        buckets: {
          [String(NOW - 6 * HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 1_000,
          }),
        },
        windowStartMs: NOW - 5 * HOUR,
        nowMs: NOW,
      });

      expect(result).toBe(0);
    });

    it('EDGE: {a bucket stamped in the future} => is excluded, so a skewed clock cannot inflate the window', () => {
      const result = usageBucketsToWeightedTotalTransformer({
        buckets: {
          [String(NOW + HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 1_000,
          }),
        },
        windowStartMs: NOW - 5 * HOUR,
        nowMs: NOW,
      });

      expect(result).toBe(0);
    });

    it('EDGE: {a non-numeric bucket key} => is skipped rather than poisoning the total', () => {
      const result = usageBucketsToWeightedTotalTransformer({
        buckets: {
          corrupt: UsageBucketStub({ input: 0, cacheCreation: 0, cacheRead: 0, output: 9 }),
          [String(NOW - HOUR)]: UsageBucketStub({
            input: 0,
            cacheCreation: 0,
            cacheRead: 0,
            output: 2,
          }),
        },
        windowStartMs: NOW - 5 * HOUR,
        nowMs: NOW,
      });

      expect(result).toBe(10);
    });
  });

  describe('real scale', () => {
    it('VALID: {a measured week of spend} => reproduces the observed seven-day ceiling', () => {
      // The four totals measured across one real week of transcripts, in one bucket.
      const result = usageBucketsToWeightedTotalTransformer({
        buckets: {
          [String(NOW - HOUR)]: UsageBucketStub({
            input: 180_930,
            cacheCreation: 470_183_777,
            cacheRead: 19_108_026_948,
            output: 50_531_828,
          }),
        },
        windowStartMs: NOW - 168 * HOUR,
        nowMs: NOW,
      });

      expect(result).toBe(2_751_372_486.05);
    });
  });
});
