/**
 * PURPOSE: Assembles the whole machine block — free/total memory, cores and
 * load average from `os`, free disk on the specified filesystem path (`diskPath`),
 * and the kernel's own OOM-kill counter (`machineOomCountBroker`). Statfs's the
 * provided diskPath directly: free disk is a property of the filesystem.
 * There is no time-of-last-OOM reading: the journal line it would come from needs
 * privileges this process may not have, and an absence is never a claimed cause.
 * No child process and no dependency — this is what machine callers share.
 *
 * USAGE:
 * await machineReadBroker({ diskPath: '/path/to/disk' });
 * // Returns { freeMemMB, totalMemMB, freeDiskMB, cores, loadAvg, oomKillsSinceBoot }
 */

import { diskFreeBytes } from '#gateway/node/fs__promises';
import { cpus, freemem, loadavg, totalmem } from '#gateway/node/os';

import { machineReadingContract } from '../../../contracts/machine-reading/machine-reading-contract';
import type { MachineReading } from '../../../contracts/machine-reading/machine-reading-contract';
import { machineStatics } from '../../../statics/machine/machine-statics';
import { machineOomCountBroker } from '../oom-count/machine-oom-count-broker';

export const machineReadBroker = async ({
  diskPath,
}: {
  diskPath: string;
}): Promise<MachineReading> => {
  const { bytesPerMegabyte } = machineStatics.units;
  const freeMemMB = Math.floor(freemem() / bytesPerMegabyte);
  const totalMemMB = Math.floor(totalmem() / bytesPerMegabyte);
  const cores = cpus().length;
  const loadAvg = loadavg();

  const [freeDiskBytes, oomKillsSinceBoot] = await Promise.all([
    diskFreeBytes(diskPath),
    machineOomCountBroker(),
  ]);

  const freeDiskMB = freeDiskBytes === null ? null : Math.floor(freeDiskBytes / bytesPerMegabyte);

  return machineReadingContract.parse({
    freeMemMB,
    totalMemMB,
    freeDiskMB,
    cores,
    loadAvg,
    oomKillsSinceBoot,
  });
};
