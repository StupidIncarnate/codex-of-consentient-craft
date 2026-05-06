/**
 * PURPOSE: Atomically writes a RateLimitsSnapshot to ~/.dungeonmaster/rate-limits.json with a 5-second mtime-based throttle
 *
 * USAGE:
 * const result = await rateLimitsSnapshotWriteBroker({ snapshot, nowMs });
 * // Returns { written: true } on accepted write, { written: false } when throttled
 */

import {
  fileContentsContract,
  filePathContract,
  type RateLimitsSnapshot,
} from '@dungeonmaster/shared/contracts';
import { pathDirnameAdapter } from '@dungeonmaster/shared/adapters';
import {
  locationsRateLimitsSnapshotPathFindBroker,
  locationsRateLimitsSnapshotTmpPathFindBroker,
} from '@dungeonmaster/shared/brokers';

import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { rateLimitsThrottleStatics } from '../../../statics/rate-limits-throttle/rate-limits-throttle-statics';

export const rateLimitsSnapshotWriteBroker = async ({
  snapshot,
  nowMs,
}: {
  snapshot: RateLimitsSnapshot;
  nowMs: number;
}): Promise<{ written: boolean }> => {
  const snapshotPath = locationsRateLimitsSnapshotPathFindBroker();
  const tmpPath = locationsRateLimitsSnapshotTmpPathFindBroker();

  const stats = await fsStatAdapter({ filePath: filePathContract.parse(snapshotPath) });
  if (stats !== null && nowMs - stats.mtimeMs < rateLimitsThrottleStatics.minIntervalMs) {
    return { written: false };
  }

  const homeDir = pathDirnameAdapter({ path: filePathContract.parse(snapshotPath) });
  await fsMkdirAdapter({ filePath: homeDir });

  const contents = fileContentsContract.parse(`${JSON.stringify(snapshot)}\n`);
  await fsWriteFileAdapter({ filePath: filePathContract.parse(tmpPath), contents });
  await fsRenameAdapter({
    from: filePathContract.parse(tmpPath),
    to: filePathContract.parse(snapshotPath),
  });

  return { written: true };
};
