/**
 * PURPOSE: Assembles the whole machine block — free/total memory, cores and
 * load average from `os`, free disk on the specified filesystem path (`diskPath`),
 * and the kernel's own OOM-kill counter (`machineOomCountBroker`). Takes cgroup v2
 * container limits into account when present (`machineCgroupLimitsBroker`). Statfs's the
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
import { machineCgroupLimitsBroker } from '../cgroup-limits/machine-cgroup-limits-broker';
import { machineOomCountBroker } from '../oom-count/machine-oom-count-broker';

export const machineReadBroker = async ({
  diskPath,
}: {
  diskPath: string;
}): Promise<MachineReading> => {
  const { bytesPerMegabyte } = machineStatics.units;
  const hostFreeMemMB = Math.floor(freemem() / bytesPerMegabyte);
  const hostTotalMemMB = Math.floor(totalmem() / bytesPerMegabyte);
  const hostCores = cpus().length;
  const loadAvg = loadavg();

  const [freeDiskBytes, oomKillsSinceBoot, cgroup] = await Promise.all([
    diskFreeBytes(diskPath),
    machineOomCountBroker(),
    machineCgroupLimitsBroker(),
  ]);

  const totalMemMB =
    cgroup.memoryLimitMB === null ? hostTotalMemMB : Math.min(hostTotalMemMB, cgroup.memoryLimitMB);

  const freeMemMB =
    cgroup.memoryLimitMB === null
      ? hostFreeMemMB
      : Math.min(hostFreeMemMB, Math.max(0, cgroup.memoryLimitMB - (cgroup.cgroupUsageMB ?? 0)));

  const cores =
    cgroup.cpuLimitCores === null ? hostCores : Math.min(hostCores, cgroup.cpuLimitCores);

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
