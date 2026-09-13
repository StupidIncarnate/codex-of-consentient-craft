import { UsageBucketStub, UsageLedgerStub } from '@dungeonmaster/shared/contracts';

import { RateLimitsGetResponder } from './rate-limits-get-responder';
import { RateLimitsGetResponderProxy } from './rate-limits-get-responder.proxy';

const HOUR = 3_600_000;
const FIVE_HOURS = 18_000_000;
const SEVEN_DAYS = 604_800_000;
const NOW = Date.parse('2026-09-13T05:00:00.000Z');

describe('RateLimitsGetResponder', () => {
  describe('an uncalibrated machine', () => {
    it('EMPTY: {no ceiling for either window} => returns null rather than a fabricated 0%', async () => {
      const proxy = RateLimitsGetResponderProxy();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: {
            [String(NOW - HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 186,
            }),
          },
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
        }),
      });

      await expect(RateLimitsGetResponder()).resolves.toBe(null);
    });

    it('EMPTY: {nothing measured at all} => returns null', async () => {
      RateLimitsGetResponderProxy();

      await expect(RateLimitsGetResponder()).resolves.toBe(null);
    });
  });

  describe('a calibrated machine', () => {
    it('VALID: {930 weighted spend against a 1000 seven-day ceiling and a 3100 five-hour one} => returns both windows', async () => {
      const proxy = RateLimitsGetResponderProxy();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          // 186 output tokens weight to 930 — 93% of 1000, and 30% of 3100.
          buckets: {
            [String(NOW - HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 186,
            }),
          },
          cursors: {},
          ceilings: { fiveHour: 3_100, sevenDay: 1_000 },
        }),
      });

      await expect(RateLimitsGetResponder()).resolves.toStrictEqual({
        // Under the hold threshold, so the five-hour window is already clear and resets now.
        fiveHour: { usedPercentage: 30, resetsAt: '2026-09-13T05:00:00.000Z' },
        // Over it, so the seven-day window clears when its one bucket ages out.
        sevenDay: {
          usedPercentage: 93,
          resetsAt: new Date(NOW - HOUR + SEVEN_DAYS + HOUR).toISOString(),
        },
        updatedAt: '2026-09-13T05:00:00.000Z',
      });
    });

    it('VALID: {only the seven-day window calibrated} => serves that one and leaves five-hour null', async () => {
      const proxy = RateLimitsGetResponderProxy();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: {
            [String(NOW - HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 100,
            }),
          },
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: 1_000 },
        }),
      });

      await expect(RateLimitsGetResponder()).resolves.toStrictEqual({
        fiveHour: null,
        sevenDay: { usedPercentage: 50, resetsAt: '2026-09-13T05:00:00.000Z' },
        updatedAt: '2026-09-13T05:00:00.000Z',
      });
    });

    it('EMPTY: {calibrated but nothing spent in either window} => serves 0%, which is a measurement rather than a guess', async () => {
      const proxy = RateLimitsGetResponderProxy();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: {},
          ceilings: { fiveHour: 1_000, sevenDay: 1_000 },
        }),
      });

      await expect(RateLimitsGetResponder()).resolves.toStrictEqual({
        fiveHour: { usedPercentage: 0, resetsAt: '2026-09-13T05:00:00.000Z' },
        sevenDay: { usedPercentage: 0, resetsAt: '2026-09-13T05:00:00.000Z' },
        updatedAt: '2026-09-13T05:00:00.000Z',
      });
    });

    it('VALID: {spend older than five hours} => counts for seven days and not for five', async () => {
      const proxy = RateLimitsGetResponderProxy();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: {
            [String(NOW - FIVE_HOURS - HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 100,
            }),
          },
          cursors: {},
          ceilings: { fiveHour: 1_000, sevenDay: 1_000 },
        }),
      });

      await expect(RateLimitsGetResponder()).resolves.toStrictEqual({
        fiveHour: { usedPercentage: 0, resetsAt: '2026-09-13T05:00:00.000Z' },
        sevenDay: { usedPercentage: 50, resetsAt: '2026-09-13T05:00:00.000Z' },
        updatedAt: '2026-09-13T05:00:00.000Z',
      });
    });
  });

  describe('the reading is taken now', () => {
    it('VALID: {any call} => brings the ledger up to date against the current clock', async () => {
      const proxy = RateLimitsGetResponderProxy();

      await RateLimitsGetResponder();

      expect(proxy.scanCalls()).toStrictEqual([[{ nowMs: NOW }]]);
    });
  });
});
