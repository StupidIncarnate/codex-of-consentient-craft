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

import { join } from '#gateway/node/path';

import { readFileIfExists } from '#gateway/node/fs__promises';
import { machineStatics } from '../../../statics/machine/machine-statics';

export const machineOomCountBroker = async (): Promise<number | null> => {
  const vmstatPath = join(machineStatics.procfs.root, machineStatics.procfs.vmstat);

  const content = await readFileIfExists(vmstatPath);

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

  return Number(oomKillLine[1]);
};
