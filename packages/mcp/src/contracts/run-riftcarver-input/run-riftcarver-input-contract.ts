/**
 * PURPOSE: The published input schema for the MCP run-riftcarver tool, which /dumpster-launch calls
 * when get-next-step hands it a `run-riftcarver` step. Reach for this over runWardInputContract for
 * the other command role: riftcarver carries no `mode` because there is only one way to carve a
 * workspace, where ward's scope is the caller's choice.
 *
 * USAGE:
 * runRiftcarverInputContract.parse({ questId, workItemId });
 * // Returns: validated RunRiftcarverInput
 */
import { z } from 'zod';

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

export const runRiftcarverInputContract = z
  .object({
    questId: questIdContract.describe(
      'Quest whose branch, worktree and preflight build are carved',
    ),
    workItemId: questWorkItemIdContract.describe(
      'Work item the carve is being executed for — echo `result.workItemId` from the get-next-step step verbatim',
    ),
  })
  .strict();

export type RunRiftcarverInput = z.infer<typeof runRiftcarverInputContract>;
