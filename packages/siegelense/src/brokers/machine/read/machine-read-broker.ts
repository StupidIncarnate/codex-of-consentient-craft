/**
 * PURPOSE: Assembles the whole `machine` block of a `status` answer — free/total memory, cores and
 * load average from `os` (`osInfoAdapter`), free disk under the siegelense root (`fsStatfsAdapter`),
 * and the kernel's own OOM-kill counter (`machineOomCountBroker`). `lastOomAt` stays `null` in this
 * chunk: the journal line it would come from needs privileges this process may not have, and
 * chunk-03-read-path-and-perception.md §3.D is explicit that an absence is never a claimed cause. No
 * child process and no dependency — this is what every `status` call shares.
 *
 * USAGE:
 * await machineReadBroker();
 * // Returns { freeMemMB, totalMemMB, freeDiskMB, cores, loadAvg, oomKillsSinceBoot, lastOomAt: null }
 */

import { fsStatfsAdapter } from '../../../adapters/fs/statfs/fs-statfs-adapter';
import { osInfoAdapter } from '../../../adapters/os/info/os-info-adapter';
import { machineReadingContract } from '../../../contracts/machine-reading/machine-reading-contract';
import type { MachineReading } from '../../../contracts/machine-reading/machine-reading-contract';
import { locationsRootPathFindBroker } from '../../locations/root-path-find/locations-root-path-find-broker';
import { machineOomCountBroker } from '../oom-count/machine-oom-count-broker';

export const machineReadBroker = async (): Promise<MachineReading> => {
  const { freeMemMB, totalMemMB, cores, loadAvg } = osInfoAdapter();
  const rootPath = locationsRootPathFindBroker();

  const [freeDiskMB, oomKillsSinceBoot] = await Promise.all([
    fsStatfsAdapter({ dirPath: rootPath }),
    machineOomCountBroker(),
  ]);

  return machineReadingContract.parse({
    freeMemMB,
    totalMemMB,
    freeDiskMB,
    cores,
    loadAvg,
    oomKillsSinceBoot,
    lastOomAt: null,
  });
};
