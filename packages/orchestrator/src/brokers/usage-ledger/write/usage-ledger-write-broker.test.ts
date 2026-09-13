import { UsageBucketStub, UsageLedgerStub } from '@dungeonmaster/shared/contracts';

import { usageLedgerWriteBroker } from './usage-ledger-write-broker';
import { usageLedgerWriteBrokerProxy } from './usage-ledger-write-broker.proxy';

const HOUR = 3_600_000;
const SEVEN_DAYS = 604_800_000;
const NOW = Date.parse('2026-09-13T05:00:00.000Z');

describe('usageLedgerWriteBroker', () => {
  describe('pruning', () => {
    it('VALID: {a bucket inside the seven-day window} => is kept', async () => {
      const proxy = usageLedgerWriteBrokerProxy();
      proxy.setupWriteSuccess();

      const result = await usageLedgerWriteBroker({
        ledger: UsageLedgerStub({
          buckets: { [String(NOW - HOUR)]: UsageBucketStub() },
          cursors: {},
        }),
        nowMs: NOW,
      });

      expect(result.buckets).toStrictEqual({
        [String(NOW - HOUR)]: { input: 120, cacheCreation: 4_000, cacheRead: 90_000, output: 300 },
      });
    });

    it('VALID: {a bucket older than seven days} => is dropped, because no window can read it again', async () => {
      const proxy = usageLedgerWriteBrokerProxy();
      proxy.setupWriteSuccess();

      const result = await usageLedgerWriteBroker({
        ledger: UsageLedgerStub({
          buckets: { [String(NOW - SEVEN_DAYS - HOUR)]: UsageBucketStub() },
          cursors: {},
        }),
        nowMs: NOW,
      });

      expect(result.buckets).toStrictEqual({});
    });

    it('EDGE: {a bucket exactly at the window edge} => is kept', async () => {
      const proxy = usageLedgerWriteBrokerProxy();
      proxy.setupWriteSuccess();

      const result = await usageLedgerWriteBroker({
        ledger: UsageLedgerStub({
          buckets: { [String(NOW - SEVEN_DAYS)]: UsageBucketStub() },
          cursors: {},
        }),
        nowMs: NOW,
      });

      expect(result.buckets).toStrictEqual({
        [String(NOW - SEVEN_DAYS)]: {
          input: 120,
          cacheCreation: 4_000,
          cacheRead: 90_000,
          output: 300,
        },
      });
    });

    it('VALID: {a cursor for a transcript untouched in a week} => is dropped', async () => {
      const proxy = usageLedgerWriteBrokerProxy();
      proxy.setupWriteSuccess();

      const result = await usageLedgerWriteBroker({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: { '/a/stale.jsonl': { mtimeMs: NOW - SEVEN_DAYS - HOUR, size: 10 } },
        }),
        nowMs: NOW,
      });

      expect(result.cursors).toStrictEqual({});
    });

    it('VALID: {a cursor for a recent transcript} => is kept', async () => {
      const proxy = usageLedgerWriteBrokerProxy();
      proxy.setupWriteSuccess();

      const result = await usageLedgerWriteBroker({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: { '/a/live.jsonl': { mtimeMs: NOW - HOUR, size: 10 } },
        }),
        nowMs: NOW,
      });

      expect(result.cursors).toStrictEqual({ '/a/live.jsonl': { mtimeMs: NOW - HOUR, size: 10 } });
    });
  });

  describe('what survives a write', () => {
    it('VALID: {calibrated ceilings} => are never pruned, because they outlive every window', async () => {
      const proxy = usageLedgerWriteBrokerProxy();
      proxy.setupWriteSuccess();

      const result = await usageLedgerWriteBroker({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: {},
          ceilings: { fiveHour: 122_469_486, sevenDay: 2_751_372_486 },
        }),
        nowMs: NOW,
      });

      expect(result.ceilings).toStrictEqual({
        fiveHour: 122_469_486,
        sevenDay: 2_751_372_486,
      });
    });

    it('VALID: {any write} => stamps updatedAt to now', async () => {
      const proxy = usageLedgerWriteBrokerProxy();
      proxy.setupWriteSuccess();

      const result = await usageLedgerWriteBroker({
        ledger: UsageLedgerStub({ buckets: {}, cursors: {} }),
        nowMs: NOW,
      });

      expect(result.updatedAt).toBe('2026-09-13T05:00:00.000Z');
    });

    it('VALID: {any write} => the tmp file carries the pruned ledger, which the rename then publishes', async () => {
      const proxy = usageLedgerWriteBrokerProxy();
      proxy.setupWriteSuccess();

      await usageLedgerWriteBroker({
        ledger: UsageLedgerStub({
          buckets: { [String(NOW - SEVEN_DAYS - HOUR)]: UsageBucketStub() },
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
        }),
        nowMs: NOW,
      });

      expect(JSON.parse(String(proxy.getWrittenContent()))).toStrictEqual({
        buckets: {},
        cursors: {},
        ceilings: { fiveHour: null, sevenDay: 2_751_372_486 },
        updatedAt: '2026-09-13T05:00:00.000Z',
      });
    });
  });

  describe('failures', () => {
    it('ERROR: {the tmp write fails} => rejects with the write error', async () => {
      const proxy = usageLedgerWriteBrokerProxy();
      proxy.setupWriteFailure({ error: new Error('disk full') });

      await expect(
        usageLedgerWriteBroker({
          ledger: UsageLedgerStub({ buckets: {}, cursors: {} }),
          nowMs: NOW,
        }),
      ).rejects.toThrow(/^disk full$/u);
    });
  });
});
