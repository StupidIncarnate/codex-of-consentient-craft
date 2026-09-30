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

import { diskFreeBytes } from '#gateway/node/fs__promises';
import { cpus, freemem, loadavg, totalmem } from '#gateway/node/os';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';

import { loadAverageContract } from '../../../contracts/load-average/load-average-contract';
import { machineReadingContract } from '../../../contracts/machine-reading/machine-reading-contract';
import type { MachineReading } from '../../../contracts/machine-reading/machine-reading-contract';
import { machineStatics } from '../../../statics/machine/machine-statics';
import { machineOomCountBroker } from '../oom-count/machine-oom-count-broker';

export const machineReadBroker = async (): Promise<MachineReading> => {
  const { bytesPerMegabyte } = machineStatics.units;
  const freeMemMB = Math.floor(freemem() / bytesPerMegabyte);
  const totalMemMB = Math.floor(totalmem() / bytesPerMegabyte);
  const cores = cpus().length;
  const loadAvg = loadAverageContract.parse(loadavg());

  const { homePath } = dungeonmasterHomeFindBroker();
  const homeDirPath = homePath;

  const [freeDiskBytes, oomKillsSinceBoot] = await Promise.all([
    diskFreeBytes(homeDirPath),
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
    lastOomAt: null,
  });
};
