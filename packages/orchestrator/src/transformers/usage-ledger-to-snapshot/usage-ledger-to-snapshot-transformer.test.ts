import { UsageBucketStub, UsageLedgerStub } from '@dungeonmaster/shared/contracts';

import { usageLedgerToSnapshotTransformer } from './usage-ledger-to-snapshot-transformer';

const HOUR = 3_600_000;
const NOW = Date.parse('2026-09-13T05:00:00.000Z');

describe('usageLedgerToSnapshotTransformer', () => {
  describe('uncalibrated windows', () => {
    it('EMPTY: {no ceiling for either window} => both report null, so nothing holds on a guess', () => {
      const result = usageLedgerToSnapshotTransformer({
        ledger: UsageLedgerStub({
          buckets: {},
          ceilings: { fiveHour: null, sevenDay: null },
        }),
        nowMs: NOW,
      });

      expect(result).toStrictEqual({
        fiveHour: null,
        sevenDay: null,
        updatedAt: '2026-09-13T05:00:00.000Z',
      });
    });

    it('EDGE: {a ceiling of zero} => reports null rather than an infinite percentage', () => {
      const result = usageLedgerToSnapshotTransformer({
        ledger: UsageLedgerStub({
          buckets: {},
          ceilings: { fiveHour: 0, sevenDay: null },
        }),
        nowMs: NOW,
      });

      expect(result.fiveHour).toBe(null);
    });

    it('VALID: {only the seven-day window calibrated} => reports that one and leaves five-hour null', () => {
      const result = usageLedgerToSnapshotTransformer({
        ledger: UsageLedgerStub({
          buckets: {
            [String(NOW - HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 100,
            }),
          },
          ceilings: { fiveHour: null, sevenDay: 1_000 },
        }),
        nowMs: NOW,
      });

      // 100 output weights to 500 of a 1000 ceiling.
      expect([result.fiveHour, result.sevenDay?.usedPercentage]).toStrictEqual([null, 50]);
    });
  });

  describe('calibrated windows', () => {
    it('VALID: {spend at 93% of the observed ceiling} => reports 93', () => {
      const result = usageLedgerToSnapshotTransformer({
        ledger: UsageLedgerStub({
          buckets: {
            [String(NOW - HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 186,
            }),
          },
          ceilings: { fiveHour: null, sevenDay: 1_000 },
        }),
        nowMs: NOW,
      });

      expect(result.sevenDay?.usedPercentage).toBe(93);
    });

    it('EDGE: {spend above the ceiling} => clamps at 100 rather than failing the contract', () => {
      const result = usageLedgerToSnapshotTransformer({
        ledger: UsageLedgerStub({
          buckets: {
            [String(NOW - HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 10_000,
            }),
          },
          ceilings: { fiveHour: null, sevenDay: 1_000 },
        }),
        nowMs: NOW,
      });

      expect(result.sevenDay?.usedPercentage).toBe(100);
    });

    it('EMPTY: {calibrated but nothing spent} => reports 0', () => {
      const result = usageLedgerToSnapshotTransformer({
        ledger: UsageLedgerStub({
          buckets: {},
          ceilings: { fiveHour: 1_000, sevenDay: 1_000 },
        }),
        nowMs: NOW,
      });

      expect([result.fiveHour?.usedPercentage, result.sevenDay?.usedPercentage]).toStrictEqual([
        0, 0,
      ]);
    });

    it('VALID: {spend over the threshold} => resetsAt names when the window clears, not a fixed wait', () => {
      const result = usageLedgerToSnapshotTransformer({
        ledger: UsageLedgerStub({
          buckets: {
            [String(NOW - HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 200,
            }),
          },
          ceilings: { fiveHour: 1_000, sevenDay: null },
        }),
        nowMs: NOW,
      });

      // The one bucket started an hour ago and leaves the five-hour window five hours after that,
      // plus the hour it spans.
      expect(result.fiveHour?.resetsAt).toBe(
        new Date(NOW - HOUR + 18_000_000 + HOUR).toISOString(),
      );
    });
  });

  describe('the two windows differ', () => {
    it('VALID: {old spend outside five hours} => counts for seven days and not for five hours', () => {
      const result = usageLedgerToSnapshotTransformer({
        ledger: UsageLedgerStub({
          buckets: {
            [String(NOW - 10 * HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 100,
            }),
          },
          ceilings: { fiveHour: 1_000, sevenDay: 1_000 },
        }),
        nowMs: NOW,
      });

      expect([result.fiveHour?.usedPercentage, result.sevenDay?.usedPercentage]).toStrictEqual([
        0, 50,
      ]);
    });
  });
});
