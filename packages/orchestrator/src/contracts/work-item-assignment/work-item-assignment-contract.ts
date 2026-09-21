/**
 * PURPOSE: Narrows a work item's untyped `payload` down to the one key that says which units the
 * session was HANDED — `units[].unitId`. Reach for this over `workPlanPayloadCodeweaverContract` and
 * its per-family siblings when all you want is the assignment: each of those describes one family's
 * whole brief and refuses a payload belonging to another family, where this one asserts a single key
 * and lets every family's payload through.
 *
 * USAGE:
 * workItemAssignmentContract.safeParse(workItem.payload);
 * // Returns: { success: true, data: { units: [{ unitId: 'send-flow:observable:obs-3' }] } }
 */

import { unitIdContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const workItemAssignmentContract = z.object({
  // `.passthrough()`, because each family's entry carries more than the id — `layer`, `surface`,
  // `assert`, `failsIf` — and stripping them here would make this contract a description of the
  // payload rather than an assertion about one key of it.
  // `.default([])` so a payload carrying no `units` key parses and contributes nothing, rather than
  // throwing and sending the caller down its absent-payload branch.
  units: z.array(z.object({ unitId: unitIdContract }).passthrough()).default([]),
});

export type WorkItemAssignment = z.infer<typeof workItemAssignmentContract>;
