import { UsageBucketStub, UsageLedgerStub } from '@dungeonmaster/shared/contracts';

import { orchestrationDispatchState } from '../../../state/orchestration-dispatch/orchestration-dispatch-state';

import { EvaluateHoldLayerResponder } from './evaluate-hold-layer-responder';
import { EvaluateHoldLayerResponderProxy } from './evaluate-hold-layer-responder.proxy';

const HOUR = 3_600_000;
const NOW = Date.parse('2026-09-13T05:00:00.000Z');
// The bus hands a subscriber the event WITHOUT its `type` — that is the key it routed on. Every
// timestamp below reads as the same instant because the evaluate broker's write proxy pins
// Date.prototype.toISOString; the real recovery arithmetic is measured against a live clock in
// usage-window-recovery-at-transformer.test.ts.
const PINNED = '2024-01-15T10:00:00.000Z';

describe('EvaluateHoldLayerResponder', () => {
  describe('holding on measured spend', () => {
    it('VALID: {measured spend at 93% of the learned ceiling} => the hold lands in the dispatch state', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupNoHeldState();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          // 186 output tokens weight to 930, which is 93% of a 1000 ceiling.
          buckets: {
            [String(NOW - HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 186,
            }),
          },
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: 1_000 },
        }),
      });

      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(orchestrationDispatchState.getHold()).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93% — dispatch holds until it resets',
        heldAt: '2024-01-15T10:00:00.000Z',
        resumeAt: new Date(NOW - HOUR + 604_800_000 + HOUR).toISOString(),
      });
    });

    it('VALID: {a hold lands while the user has play pressed} => getIsPlaying flips to false', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupNoHeldState();
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
          ceilings: { fiveHour: null, sevenDay: 1_000 },
        }),
      });
      orchestrationDispatchState.setPlaying({ isPlaying: true });

      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(orchestrationDispatchState.getIsPlaying()).toBe(false);
    });

    it('VALID: {spend well under the ceiling} => nothing is held and dispatch stays free', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupNoHeldState();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: {
            [String(NOW - HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 10,
            }),
          },
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: 1_000 },
        }),
      });
      orchestrationDispatchState.setPlaying({ isPlaying: true });

      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect([
        orchestrationDispatchState.getHold(),
        orchestrationDispatchState.getIsPlaying(),
      ]).toStrictEqual([null, true]);
    });
  });

  describe('an uncalibrated machine', () => {
    it('EMPTY: {no ceiling learned yet} => holds nothing, however much has been spent', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupNoHeldState();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: {
            [String(NOW - HOUR)]: UsageBucketStub({
              input: 0,
              cacheCreation: 0,
              cacheRead: 0,
              output: 999_999,
            }),
          },
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
        }),
      });
      orchestrationDispatchState.setPlaying({ isPlaying: true });

      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      // Nothing to compare against, so the percentage gate stays silent and only a real 429 stops
      // the queue. A guessed ceiling here would hold on a number that means nothing.
      expect(orchestrationDispatchState.getHold()).toBe(null);
    });
  });

  describe('restoring a persisted hold', () => {
    it('VALID: {a hold already on disk} => is restored into memory', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupHeldState();

      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(orchestrationDispatchState.getHold()).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93%',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-13T06:00:00.000Z',
      });
    });
  });

  describe('publishing the reading', () => {
    it('VALID: {a measured reading} => emits rate-limits-updated so the cards repaint without a reload', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupNoHeldState();
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

      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      // 100 output weights to 500 of a 1000 ceiling.
      expect(proxy.measureEvents()).toStrictEqual([
        {
          processId: 'rate-limits-measure',
          payload: {
            snapshot: {
              fiveHour: null,
              sevenDay: { usedPercentage: 50, resetsAt: PINNED },
              updatedAt: PINNED,
            },
          },
        },
      ]);
    });

    it('VALID: {two passes over the same ledger} => emits ONCE, so a poll tick does not re-notify forever', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupNoHeldState();
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

      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(proxy.measureEvents()).toStrictEqual([
        {
          processId: 'rate-limits-measure',
          payload: {
            snapshot: {
              fiveHour: null,
              sevenDay: { usedPercentage: 50, resetsAt: PINNED },
              updatedAt: PINNED,
            },
          },
        },
      ]);
    });

    it('EMPTY: {an uncalibrated ledger} => emits nothing, because both windows read null before and after', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupNoHeldState();
      proxy.setupLedger({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
        }),
      });

      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(proxy.measureEvents()).toStrictEqual([]);
    });
  });

  describe('one scan at a time', () => {
    it('VALID: {a tick lands while a scan is still running} => starts no second scan', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupNoHeldState();
      proxy.setupPendingScan({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
        }),
      });

      EvaluateHoldLayerResponder();
      EvaluateHoldLayerResponder();
      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(proxy.scanCalls()).toStrictEqual([[{ nowMs: NOW }]]);
    });

    it('VALID: {the running scan finishes} => the next tick scans again', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupNoHeldState();
      const { finishScan } = proxy.setupPendingScan({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
        }),
      });

      EvaluateHoldLayerResponder();
      finishScan();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(proxy.scanCalls()).toStrictEqual([[{ nowMs: NOW }], [{ nowMs: NOW }]]);
    });

    it('VALID: {a tick lands while a scan is still running} => still restores the persisted hold', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupHeldState();
      proxy.setupPendingScan({
        ledger: UsageLedgerStub({
          buckets: {},
          cursors: {},
          ceilings: { fiveHour: null, sevenDay: null },
        }),
      });

      // The first tick's scan never finishes, so only the second tick can have evaluated the hold.
      EvaluateHoldLayerResponder();
      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(orchestrationDispatchState.getHold()).toStrictEqual({
        reason: 'approaching-limit',
        window: 'seven-day',
        detail: '7d window at 93%',
        heldAt: '2026-09-13T04:49:29.242Z',
        resumeAt: '2026-09-13T06:00:00.000Z',
      });
    });

    it('ERROR: {the scan fails} => logs, and the next tick scans again', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupNoHeldState();
      proxy.setupScanFailure();

      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect([proxy.scanCalls(), proxy.stderrLines()]).toStrictEqual([
        [[{ nowMs: NOW }], [{ nowMs: NOW }]],
        [['[rate-limits] dispatch hold evaluation failed: EMFILE: too many open files\n']],
      ]);
    });
  });

  describe('the caller is a timer tick', () => {
    it('VALID: {any call} => returns before the scan resolves, so the hold is still unset synchronously', () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupNoHeldState();
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
          ceilings: { fiveHour: null, sevenDay: 1_000 },
        }),
      });

      EvaluateHoldLayerResponder();

      // The scan is fire-and-forget: the call above returned before its promise chain settled, so
      // the hold this ledger would raise (93% of the ceiling) has not landed yet.
      expect(orchestrationDispatchState.getHold()).toBe(null);
    });

    it('ERROR: {the state write fails} => logs and leaves the poller alive rather than throwing', async () => {
      const proxy = EvaluateHoldLayerResponderProxy();
      proxy.setupWriteFailure();
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
          ceilings: { fiveHour: null, sevenDay: 1_000 },
        }),
      });

      EvaluateHoldLayerResponder();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(proxy.stderrLines()).toStrictEqual([
        ['[rate-limits] dispatch hold evaluation failed: disk full\n'],
      ]);
    });
  });
});
