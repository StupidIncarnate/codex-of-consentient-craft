/**
 * PURPOSE: Reads stdin, extracts rate_limits, writes throttled snapshot + appends history line, passes stdin through to stdout
 *
 * USAGE:
 * await CliStatuslineTapResponder();
 * // Reads JSON on stdin (Claude Code's status payload), echoes verbatim to stdout, side-effects on disk only
 *
 * Composability: this is a tap, not a statusline. Users chain it into their own statusline pipeline:
 *   "statusLine": { "command": "dungeonmaster statusline-tap | <user statusline>" }
 *
 * Failure mode: never blocks the user's statusline. Parse errors / fs errors are silently swallowed
 * (logged to stderr) — stdout passthrough always succeeds. Exit code 0 always.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { processStdinReadAdapter } from '../../../adapters/process/stdin-read/process-stdin-read-adapter';
import { rateLimitsHistoryAppendBroker } from '../../../brokers/rate-limits/history-append/rate-limits-history-append-broker';
import { rateLimitsSnapshotWriteBroker } from '../../../brokers/rate-limits/snapshot-write/rate-limits-snapshot-write-broker';
import { statuslineInputContract } from '../../../contracts/statusline-input/statusline-input-contract';
import { statuslineToSnapshotTransformer } from '../../../transformers/statusline-to-snapshot/statusline-to-snapshot-transformer';

export const CliStatuslineTapResponder = async (): Promise<AdapterResult> => {
  const inputData = await processStdinReadAdapter();
  process.stdout.write(inputData);

  try {
    const parsed = JSON.parse(inputData) as unknown;
    const validated = statuslineInputContract.parse(parsed);

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    const snapshot = statuslineToSnapshotTransformer({ input: validated, nowIso });
    const writeResult = await rateLimitsSnapshotWriteBroker({ snapshot, nowMs });

    if (writeResult.written) {
      await rateLimitsHistoryAppendBroker({
        line: { at: snapshot.updatedAt, fiveHour: snapshot.fiveHour, sevenDay: snapshot.sevenDay },
      });
    }
  } catch (error: unknown) {
    process.stderr.write(
      `statusline-tap: ${error instanceof Error ? error.message : String(error)}\n`,
    );
  }

  return adapterResultContract.parse({ success: true });
};
