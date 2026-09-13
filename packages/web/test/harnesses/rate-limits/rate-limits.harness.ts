/**
 * PURPOSE: Seeds the rate-limit reading the web cards render, inside the e2e DUNGEONMASTER_HOME.
 *
 * The API serves the LEDGER (`usage-ledger.json`), so `writeLedger` is what changes a percentage
 * on screen. `writeSnapshot` writes the statusline-tap file (`rate-limits.json`) instead, and that
 * is what the orchestrator's poller WATCHES: a change to it is the only thing that emits
 * `rate-limits-updated`, which is the event the web binding re-fetches on. A spec that needs the
 * cards to change WITHOUT a reload therefore writes both — the ledger for the numbers, the
 * snapshot file for the wake.
 *
 * Both hooks also clear any hold off `dispatch-state.json`. A hold's `resumeAt` for a seven-day
 * window is days out, so nothing expires it inside a suite, and `dispatchHoldEvaluateBroker`
 * never re-judges a live hold — one spec's hold would otherwise disable PLAY for every spec after
 * it.
 *
 * The baseline the hooks leave is an EMPTY ledger stamped NOW, never a deleted one. A missing
 * ledger reads as stale, so the very next poll tick walks every transcript in the e2e home and
 * writes its own ledger back — and a scan that started before a spec's `writeLedger` lands after
 * it, silently replacing the ceilings the spec just set. A fresh empty ledger is inside
 * `usageAccountingStatics.scan.minIntervalMs`, so the scanner hands it straight back and writes
 * nothing for the length of a spec, leaving the spec the only writer. It also IS the uncalibrated
 * machine: no ceilings, so no percentage and no cards.
 *
 * USAGE:
 * const rateLimits = rateLimitsHarness();
 * rateLimits.writeLedger({ spendTokens: 4200, fiveHourCeiling: 10_000, sevenDayCeiling: 21_000 });
 */
import * as fs from 'fs';
import * as path from 'path';

import type { FilePath, RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';
import {
  DispatchStateStub,
  FilePathStub,
  UsageBucketStub,
  UsageLedgerStub,
} from '@dungeonmaster/shared/contracts';

const SNAPSHOT_FILENAME = 'rate-limits.json';
const LEDGER_FILENAME = 'usage-ledger.json';
const DISPATCH_STATE_FILENAME = 'dispatch-state.json';
const HOUR_MS = 3_600_000;

const resolveHomeFile = ({ filename }: { filename: string }): FilePath => {
  const home = process.env.E2E_TEST_HOME ?? process.env.DUNGEONMASTER_HOME;
  if (typeof home !== 'string' || home === '') {
    throw new Error(
      'rate-limits harness: neither E2E_TEST_HOME nor DUNGEONMASTER_HOME is set in the e2e environment',
    );
  }
  return FilePathStub({ value: path.join(home, filename) });
};

export const rateLimitsHarness = (): {
  beforeEach: () => void;
  afterEach: () => void;
  writeSnapshot: (params: { snapshot: RateLimitsSnapshot }) => void;
  writeLedger: (params: {
    spendTokens: number;
    fiveHourCeiling: number | null;
    sevenDayCeiling: number | null;
  }) => void;
} => {
  // One hour of spend, stamped into the CURRENT hour's bucket so it sits inside both windows, and
  // recorded as input tokens because their weight is 1 — the weighted total the percentage is
  // computed from is then exactly `spendTokens`.
  const writeLedger = ({
    spendTokens,
    fiveHourCeiling,
    sevenDayCeiling,
  }: {
    spendTokens: number;
    fiveHourCeiling: number | null;
    sevenDayCeiling: number | null;
  }): void => {
    const nowMs = Date.now();
    const ledgerPath = resolveHomeFile({ filename: LEDGER_FILENAME });
    fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
    fs.writeFileSync(
      ledgerPath,
      JSON.stringify(
        UsageLedgerStub({
          buckets: {
            [String(nowMs - (nowMs % HOUR_MS))]: UsageBucketStub({
              input: spendTokens,
              cacheCreation: 0,
              cacheRead: 0,
              output: 0,
            }),
          },
          cursors: {},
          ceilings: { fiveHour: fiveHourCeiling, sevenDay: sevenDayCeiling },
          updatedAt: new Date(nowMs).toISOString(),
        }),
      ),
    );
  };

  const reset = (): void => {
    fs.rmSync(resolveHomeFile({ filename: SNAPSHOT_FILENAME }), { force: true });
    writeLedger({ spendTokens: 0, fiveHourCeiling: null, sevenDayCeiling: null });

    const statePath = resolveHomeFile({ filename: DISPATCH_STATE_FILENAME });
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(
      statePath,
      `${JSON.stringify(DispatchStateStub({ mode: 'paused', hold: null }))}\n`,
    );
  };

  return {
    beforeEach: reset,

    afterEach: reset,

    writeSnapshot: ({ snapshot }: { snapshot: RateLimitsSnapshot }): void => {
      const snapshotPath = resolveHomeFile({ filename: SNAPSHOT_FILENAME });
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));
    },

    writeLedger,
  };
};
