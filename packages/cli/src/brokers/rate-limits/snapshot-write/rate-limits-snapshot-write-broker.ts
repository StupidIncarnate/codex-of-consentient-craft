/**
 * PURPOSE: Atomically writes a RateLimitsSnapshot to ~/.dungeonmaster/rate-limits.json with a 5-second mtime-based throttle
 *
 * USAGE:
 * const result = await rateLimitsSnapshotWriteBroker({ snapshot, nowMs });
 * // Returns { written: true } on accepted write, { written: false } when throttled
 */

import { dirname } from '#gateway/node/path';
import { ensureDir, rename, statIfExists, writeFile } from '#gateway/node/fs__promises';
import {
  fileContentsContract,
  filePathContract,
  type RateLimitsSnapshot,
} from '@dungeonmaster/shared/contracts';
import {
  locationsRateLimitsSnapshotPathFindBroker,
  locationsRateLimitsSnapshotTmpPathFindBroker,
} from '@dungeonmaster/shared/brokers';

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

  const stats = await statIfExists(snapshotPath);
  if (stats !== null && nowMs - stats.modifiedAtMs < rateLimitsThrottleStatics.minIntervalMs) {
    return { written: false };
  }

  const homeDir = filePathContract.parse(dirname(snapshotPath));
  await ensureDir(homeDir);

  const contents = fileContentsContract.parse(`${JSON.stringify(snapshot)}\n`);
  await writeFile(tmpPath, contents);
  await rename(tmpPath, snapshotPath);

  return { written: true };
};
