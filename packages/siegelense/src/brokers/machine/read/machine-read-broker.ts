/**
 * PURPOSE: Assembles the whole `machine` block of a `status` answer — free/total memory, cores and
 * load average from `os` (`osInfoAdapter`), free disk on the dungeonmaster home's filesystem
 * (`fsStatfsAdapter`), and the kernel's own OOM-kill counter (`machineOomCountBroker`). Statfs's the
 * home path itself, not `<home>/siegelense`: free disk is a property of the FILESYSTEM, and the
 * siegelense subdirectory only comes into existence once some instance has started, so a fresh
 * machine's first `status` call would statfs a path that is not there yet. The home path is always
 * this process's own data root — it needs no prior siegelense activity to exist. `lastOomAt` stays
 * `null` in this chunk: the journal line it would come from needs privileges this process may not
 * have, and chunk-03-read-path-and-perception.md §3.D is explicit that an absence is never a claimed
 * cause. No child process and no dependency — this is what every `status` call shares.
 *
 * USAGE:
 * await machineReadBroker();
 * // Returns { freeMemMB, totalMemMB, freeDiskMB, cores, loadAvg, oomKillsSinceBoot, lastOomAt: null }
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { fsStatfsAdapter } from '../../../adapters/fs/statfs/fs-statfs-adapter';
import { osInfoAdapter } from '../../../adapters/os/info/os-info-adapter';
import { machineReadingContract } from '../../../contracts/machine-reading/machine-reading-contract';
import type { MachineReading } from '../../../contracts/machine-reading/machine-reading-contract';
import { machineOomCountBroker } from '../oom-count/machine-oom-count-broker';

export const machineReadBroker = async (): Promise<MachineReading> => {
  const { freeMemMB, totalMemMB, cores, loadAvg } = osInfoAdapter();
  const { homePath } = dungeonmasterHomeFindBroker();
  const homeDirPath = absoluteFilePathContract.parse(homePath);

  const [freeDiskMB, oomKillsSinceBoot] = await Promise.all([
    fsStatfsAdapter({ dirPath: homeDirPath }),
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
