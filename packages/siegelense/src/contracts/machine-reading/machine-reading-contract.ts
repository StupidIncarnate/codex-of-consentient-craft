/**
 * PURPOSE: The `machine` block of a `status` answer — free/total memory, disk, cores, load average
 * and kernel OOM history, read straight from `/proc` with no child process and no dependency (spec
 * lines 1171, 1368). `freeDiskMB`, `oomKillsSinceBoot` and `lastOomAt` are `.nullable()` rather than
 * defaulted to zero: `freeDiskMB` needs a filesystem this process can statfs, and the OOM pair needs
 * privileges this process may not have, so "not there" and "genuinely zero" must stay two different
 * answers (spec line 1204: never infer a cause from an absence). Reach for this over reading
 * `/proc` again at each call site — this is the one shape every caller of `status` shares.
 *
 * USAGE:
 * machineReadingContract.parse({
 *   freeMemMB: 980, totalMemMB: 16000, freeDiskMB: 2100, cores: 8,
 *   loadAvg: [7.9, 6.2, 4.1], oomKillsSinceBoot: 2, lastOomAt: '20:11:04',
 * });
 * // Returns a validated MachineReading
 */

import { z } from '#gateway/npm/zod';


import { loadAverageContract } from '../load-average/load-average-contract';

export const machineReadingContract = z.object({
  freeMemMB: z.number().int().nonnegative().brand<'MachineReadingFreeMemMB'>(),
  totalMemMB: z.number().int().nonnegative().brand<'MachineReadingTotalMemMB'>(),
  freeDiskMB: z.number().int().nonnegative().brand<'MachineReadingFreeDiskMB'>().nullable(),
  cores: z.number().int().nonnegative().brand<'MachineReadingCores'>(),
  loadAvg: loadAverageContract,
  oomKillsSinceBoot: z.number().int().nonnegative().brand<'MachineReadingOomKillsSinceBoot'>().nullable(),
  lastOomAt: z.string().brand<'MachineReadingLastOomAt'>().nullable(),
}).brand<'MachineReading'>();

export type MachineReading = z.infer<typeof machineReadingContract>;
