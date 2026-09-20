/**
 * PURPOSE: Reads the kernel's own OOM-kill counter from `/proc/vmstat`'s `oom_kill` line — the
 * `oomKillsSinceBoot` half of a `status` answer's machine block
 * (chunk-03-read-path-and-perception.md §3.D: "readable without privileges on any modern Linux").
 * `null` covers two DIFFERENT absences on purpose — the file is missing, or the file exists but
 * never carries an `oom_kill` line — because both mean "this platform cannot answer", never zero: a
 * genuinely-zero count still round-trips through this same path (a present `oom_kill 0` line returns
 * `0`, not `null`). Any other read failure propagates — collapsing an EACCES into `null` is how a
 * caller reports a clean machine that never actually answered.
 *
 * USAGE:
 * await machineOomCountBroker();
 * // Returns the kernel's oom_kill counter, or null if /proc/vmstat or the key is unavailable
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import { machineStatics } from '../../../statics/machine/machine-statics';

export const machineOomCountBroker = async (): Promise<ReadingCount | null> => {
  const vmstatPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [machineStatics.procfs.root, machineStatics.procfs.vmstat] }),
  );

  const content = await fsReadFileAdapter({ filePath: vmstatPath }).catch((error: unknown) => {
    if (
      error !== null &&
      typeof error === 'object' &&
      errorIsNativeErrorAdapter({ value: error }) &&
      'cause' in error &&
      error.cause !== null &&
      typeof error.cause === 'object' &&
      errorIsNativeErrorAdapter({ value: error.cause }) &&
      'code' in error.cause &&
      error.cause.code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  });

  if (content === null) {
    return null;
  }

  const oomKillLine = content
    .split('\n')
    .map((line) => line.trim().split(' '))
    .find(([key]) => key === machineStatics.procfs.oomKillKey);

  if (oomKillLine === undefined) {
    return null;
  }

  return readingCountContract.parse(Number(oomKillLine[1]));
};
