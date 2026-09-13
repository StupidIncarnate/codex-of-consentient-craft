/**
 * PURPOSE: Brings the ledger up to date from the transcripts on disk — the whole measurement, and
 *   the reason the guardrail needs nothing from the user's statusline. It walks every Claude
 *   transcript on the machine and folds each one's token spend into the hourly buckets.
 *
 *   IT NEVER COUNTS THE SAME BYTES TWICE, and that is the rule the whole design serves. A
 *   transcript is append-only while a session runs, so a file that has only GROWN is read from the
 *   byte its cursor stopped at, and its earlier lines stay counted exactly once. Any other change
 *   — a file that shrank, or one whose length is unchanged but whose mtime moved — means the bytes
 *   already counted are no longer the bytes on disk, and there is no way to subtract what was
 *   counted from them, so the whole ledger is REBUILT from scratch. That case is rare (a rotation
 *   or a hand-edit) and a full rebuild was measured at 1.2s over 601 MB, which is affordable when
 *   the alternative is a permanently wrong number.
 *
 * USAGE:
 * const ledger = await usageLedgerScanBroker({ nowMs: Date.now() });
 * // Returns the ledger as persisted after the scan
 */

import type { UsageLedger } from '@dungeonmaster/shared/contracts';
import { locationsClaudeProjectsRootFindBroker } from '@dungeonmaster/shared/brokers';
import { usageAccountingStatics } from '@dungeonmaster/shared/statics';

import { fsWalkFilesAdapter } from '../../../adapters/fs/walk-files/fs-walk-files-adapter';
import { transcriptReadContract } from '../../../contracts/transcript-read/transcript-read-contract';
import { usageLedgerReadBroker } from '../read/usage-ledger-read-broker';
import { usageLedgerWriteBroker } from '../write/usage-ledger-write-broker';
import { foldBatchLayerBroker } from './fold-batch-layer-broker';

const TRANSCRIPT_SUFFIX = '.jsonl';

export const usageLedgerScanBroker = async ({ nowMs }: { nowMs: number }): Promise<UsageLedger> => {
  const ledger = await usageLedgerReadBroker();

  // The guardrail polls far faster than spend moves, so a recent measurement is returned as-is
  // rather than re-walking the tree. Without this the poller would stat ~2,200 files every few
  // seconds forever to learn a number that changes over minutes.
  if (nowMs - Date.parse(ledger.updatedAt) < usageAccountingStatics.scan.minIntervalMs) {
    return ledger;
  }

  const oldestUsefulMs = nowMs - usageAccountingStatics.windows.sevenDayMs;

  const files = fsWalkFilesAdapter({
    rootPath: locationsClaudeProjectsRootFindBroker(),
    suffix: TRANSCRIPT_SUFFIX,
  }).filter((file) => file.mtimeMs >= oldestUsefulMs);

  // A file whose recorded length no longer prefixes what is on disk invalidates every bucket, not
  // just its own — see the header.
  const needsRebuild = files.some((file) => {
    const cursor = ledger.cursors[file.path];
    if (cursor === undefined) {
      return false;
    }
    return (
      file.size < cursor.size || (file.size === cursor.size && file.mtimeMs !== cursor.mtimeMs)
    );
  });

  const buckets: UsageLedger['buckets'] = needsRebuild ? {} : { ...ledger.buckets };

  const pending = files
    .map((file) =>
      transcriptReadContract.parse({
        path: file.path,
        fromByte: needsRebuild ? 0 : (ledger.cursors[file.path]?.size ?? 0),
      }),
    )
    .filter((entry) => {
      const file = files.find((candidate) => candidate.path === entry.path);
      return file !== undefined && entry.fromByte < file.size;
    });

  const folded = await foldBatchLayerBroker({
    pending,
    buckets,
    oldestUsefulMs,
    batchSize: usageAccountingStatics.scan.batchSize,
  });

  return usageLedgerWriteBroker({
    ledger: {
      buckets: folded,
      // Every file the walk saw, read this pass or not — a cursor is what says "these bytes are
      // already counted", so one missing for an unchanged file would re-read it next tick.
      cursors: Object.fromEntries(
        files.map((file) => [file.path, { mtimeMs: file.mtimeMs, size: file.size }]),
      ),
      ceilings: ledger.ceilings,
      updatedAt: ledger.updatedAt,
    },
    nowMs,
  });
};
