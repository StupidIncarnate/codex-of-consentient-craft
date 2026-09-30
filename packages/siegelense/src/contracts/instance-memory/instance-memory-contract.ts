/**
 * PURPOSE: One instance's memory in a `status` row, as ONE value that says when it was measured —
 * `measured: 'live'` is a reading of the running lane's process groups taken for this answer,
 * `measured: 'at-last-beat'` is the figure the instance's own heartbeat file last recorded, which
 * for a dead or killed instance is its footprint when it ended. Reach for this over a bare
 * `Megabytes` in a status row: two nullable numbers for one quantity leave a reader unsure which
 * one to believe, and this carries the figure and its moment together.
 *
 * USAGE:
 * instanceMemoryContract.parse({ megabytes: 529, measured: 'at-last-beat' });
 * // Returns a validated InstanceMemory
 */

import { z } from '#gateway/npm/zod';

export const instanceMemoryContract = z
  .object({
    megabytes: z.number().int().nonnegative().brand<'InstanceMemoryMegabytes'>(),
    measured: z.enum(['live', 'at-last-beat']),
  })
  .brand<'InstanceMemory'>();

export type InstanceMemory = z.infer<typeof instanceMemoryContract>;
