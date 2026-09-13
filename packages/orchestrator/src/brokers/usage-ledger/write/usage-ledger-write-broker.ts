/**
 * PURPOSE: Persists the usage ledger atomically (temp file + rename), dropping everything the
 *   guardrail can no longer use. Reach for this rather than writing the file directly: the pruning
 *   is what keeps a file that is rewritten every scan from growing without bound, and the atomic
 *   rename is what stops the poller reading a half-written ledger and resetting the week.
 *
 * USAGE:
 * const written = await usageLedgerWriteBroker({ ledger, nowMs: Date.now() });
 * // Returns the ledger as persisted — pruned, and stamped to now
 */

import type { UsageLedger } from '@dungeonmaster/shared/contracts';
import {
  fileContentsContract,
  filePathContract,
  usageLedgerContract,
} from '@dungeonmaster/shared/contracts';
import {
  dungeonmasterHomeEnsureBroker,
  locationsUsageLedgerPathFindBroker,
  locationsUsageLedgerTmpPathFindBroker,
} from '@dungeonmaster/shared/brokers';
import { usageAccountingStatics } from '@dungeonmaster/shared/statics';

import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

export const usageLedgerWriteBroker = async ({
  ledger,
  nowMs,
}: {
  ledger: UsageLedger;
  nowMs: number;
}): Promise<UsageLedger> => {
  // The seven-day window is the longest anything asks about, so an older bucket can never be read
  // again. Keeping them would grow the file forever on a machine that is used every day.
  const oldestUsefulMs = nowMs - usageAccountingStatics.windows.sevenDayMs;

  const buckets = Object.fromEntries(
    Object.entries(ledger.buckets).filter(([key]) => {
      const start = Number(key);
      return !Number.isNaN(start) && start >= oldestUsefulMs;
    }),
  );

  // A cursor for a transcript nobody has touched in a week cannot contribute to any window either,
  // and the tree holds thousands of them.
  const cursors = Object.fromEntries(
    Object.entries(ledger.cursors).filter(([, cursor]) => cursor.mtimeMs >= oldestUsefulMs),
  );

  const persisted = usageLedgerContract.parse({
    buckets,
    cursors,
    ceilings: ledger.ceilings,
    updatedAt: new Date(nowMs).toISOString(),
  });

  await dungeonmasterHomeEnsureBroker();

  const ledgerPath = locationsUsageLedgerPathFindBroker();
  const tmpPath = locationsUsageLedgerTmpPathFindBroker();

  const contents = fileContentsContract.parse(`${JSON.stringify(persisted)}\n`);
  await fsWriteFileAdapter({ filePath: filePathContract.parse(tmpPath), contents });
  await fsRenameAdapter({
    from: filePathContract.parse(tmpPath),
    to: filePathContract.parse(ledgerPath),
  });

  return persisted;
};
