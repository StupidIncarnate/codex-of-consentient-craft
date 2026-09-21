/**
 * PURPOSE: The one number the router spends off a `capacity {}` answer — how many lane instances
 * this machine can run right now. A deliberate restatement of the `suggested` field on siegelense's
 * own `capacityAnswerContract`: the orchestrator cannot import that contract (depending on
 * `@dungeonmaster/siegelense` is a cycle), and the router has no use for `ceiling`, `why`,
 * `measured` or `profile` — it bounds a batch by one number and starts each surviving item, nothing
 * more.
 *
 * USAGE:
 * laneCapacityContract.parse({ suggested: 2 });
 * // Returns a validated LaneCapacity
 */

import { z } from 'zod';

export const laneCapacityContract = z.object({
  suggested: z.number().int().nonnegative().brand<'LaneSuggestedCount'>(),
});

export type LaneCapacity = z.infer<typeof laneCapacityContract>;
