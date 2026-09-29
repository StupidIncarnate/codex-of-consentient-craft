/**
 * PURPOSE: The `machine` block of a `status` answer — free/total memory, disk, cores, load average
 * and kernel OOM history, read straight from `/proc` with no child process and no dependency (spec
 * lines 1171, 1368). `freeDiskMB` and `oomKillsSinceBoot` are `.nullable()` rather than defaulted
 * to zero: `freeDiskMB` needs a filesystem this process can statfs, and the kernel OOM counter needs
 * a `/proc/vmstat` this process can read, so `null` means "could not read it" and `0` means "read
 * it, and it is zero" — two different answers (spec line 1204: never infer a cause from an
 * absence). No time-of-last-OOM field exists: the journal it would come from needs privileges this
 * process does not assume, and a field that is always `null` reads the same as "no OOM kill". Reach for this over reading
 * `/proc` again at each call site — this is the one shape every caller of `status` shares.
 *
 * USAGE:
 * machineReadingContract.parse({
 *   freeMemMB: 980, totalMemMB: 16000, freeDiskMB: 2100, cores: 8,
 *   loadAvg: [7.9, 6.2, 4.1], oomKillsSinceBoot: 2,
 * });
 * // Returns a validated MachineReading
 */

import { z } from 'zod';

import { loadAverageContract } from '../load-average/load-average-contract';
import { megabytesContract } from '../megabytes/megabytes-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';

export const machineReadingContract = z.object({
  freeMemMB: megabytesContract,
  totalMemMB: megabytesContract,
  freeDiskMB: megabytesContract.nullable(),
  cores: readingCountContract,
  loadAvg: loadAverageContract,
  oomKillsSinceBoot: readingCountContract.nullable(),
});

export type MachineReading = z.infer<typeof machineReadingContract>;
