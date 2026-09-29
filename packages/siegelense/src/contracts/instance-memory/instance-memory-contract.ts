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

import { z } from 'zod';

import { megabytesContract } from '../megabytes/megabytes-contract';

export const instanceMemoryContract = z.object({
  megabytes: megabytesContract,
  measured: z.enum(['live', 'at-last-beat']).brand<'MemoryMeasured'>(),
});

export type InstanceMemory = z.infer<typeof instanceMemoryContract>;
