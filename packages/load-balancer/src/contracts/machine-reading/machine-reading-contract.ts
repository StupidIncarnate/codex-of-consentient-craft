/**
 * PURPOSE: The machine block — free/total memory, disk, cores, load average
 * and kernel OOM history, read straight from `/proc` with no child process and no dependency.
 * `freeDiskMB` and `oomKillsSinceBoot` are `.nullable()` rather than defaulted to zero:
 * `freeDiskMB` needs a filesystem this process can statfs, and the kernel OOM counter needs
 * a `/proc/vmstat` this process can read, so `null` means "could not read it" and `0` means
 * "read it, and it is zero" — two different answers (never infer a cause from an absence).
 * No time-of-last-OOM field exists: the journal it would come from needs privileges this
 * process does not assume, and a field that is always `null` reads the same as "no OOM kill".
 * Reach for this over reading `/proc` again at each call site — this is the one shape every caller shares.
 *
 * USAGE:
 * machineReadingContract.parse({
 *   freeMemMB: 980, totalMemMB: 16000, freeDiskMB: 2100, cores: 8,
 *   loadAvg: [7.9, 6.2, 4.1], oomKillsSinceBoot: 2,
 * });
 * // Returns a validated MachineReading
 */

import { z } from '#gateway/npm/zod';

export const machineReadingContract = z
  .object({
    freeMemMB: z.number().int().nonnegative().brand<'MachineReadingFreeMemMB'>(),
    totalMemMB: z.number().int().nonnegative().brand<'MachineReadingTotalMemMB'>(),
    freeDiskMB: z.number().int().nonnegative().brand<'MachineReadingFreeDiskMB'>().nullable(),
    cores: z.number().int().nonnegative().brand<'MachineReadingCores'>(),
    loadAvg: z
      .tuple([
        z.number().brand<'MachineReadingLoadAvg0'>(),
        z.number().brand<'MachineReadingLoadAvg1'>(),
        z.number().brand<'MachineReadingLoadAvg2'>(),
      ])
      .brand<'MachineReadingLoadAvg'>(),
    oomKillsSinceBoot: z
      .number()
      .int()
      .nonnegative()
      .brand<'MachineReadingOomKillsSinceBoot'>()
      .nullable(),
  })
  .brand<'MachineReading'>();

export type MachineReading = z.infer<typeof machineReadingContract>;
