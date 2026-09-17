/**
 * PURPOSE: The `measured` block of a `capacity` answer — the host figures the judgement was made
 * from, so the judgement is checkable rather than trusted (siegelense-tooling.md line 1583). Reach
 * for this over `MachineReading`: that is the whole `status` post-mortem, including total memory and
 * kernel OOM history; this is the narrower set `capacity` actually divides by, plus the one figure
 * no machine reading holds — `siegeInstances`, which comes from the registry and counts load this
 * session did not create (line 1585).
 *
 * `loadAvg1` is the 1-minute figure alone, not the kernel's triple: the 5- and 15-minute averages
 * describe a window that has already passed, and nothing here divides by them. `diskFreeMB` is
 * nullable for the same reason `MachineReading.freeDiskMB` is — a filesystem this process cannot
 * statfs must answer "not measured" rather than zero.
 *
 * USAGE:
 * capacityMeasuredContract.parse({
 *   freeMemMB: 5320, cores: 8, loadAvg1: 4.2, siegeInstances: 1, diskFreeMB: 41000,
 * });
 * // Returns a validated CapacityMeasured
 */

import { z } from 'zod';

import { megabytesContract } from '../megabytes/megabytes-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';

export const capacityMeasuredContract = z
  .object({
    freeMemMB: megabytesContract,
    cores: readingCountContract,
    loadAvg1: z.number().nonnegative().brand<'LoadAverageOne'>(),
    siegeInstances: readingCountContract,
    diskFreeMB: megabytesContract.nullable(),
  })
  .strict();

export type CapacityMeasured = z.infer<typeof capacityMeasuredContract>;
