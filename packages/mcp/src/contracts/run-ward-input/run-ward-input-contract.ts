/**
 * PURPOSE: Defines the input schema for the MCP run-ward tool /dumpster-launch calls when get-next-step returns a `run-ward` step
 *
 * USAGE:
 * runWardInputContract.parse({ questId, workItemId });
 * // Returns: validated RunWardInput
 *
 * IT CARRIES NO SCOPE ARGUMENT. `wardFull` is the only family whose role is `ward`, so this tool
 * always grades the whole monorepo; a family's own committed ward is a deterministic STEP dispatched
 * as `run-step` with the scope in that step's `args`.
 */
import { z } from 'zod';

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

export const runWardInputContract = z
  .object({
    questId: questIdContract.describe('Quest the ward run is associated with'),
    workItemId: questWorkItemIdContract.describe('Work item the ward run is being executed for'),
  })
  .strict();

export type RunWardInput = z.infer<typeof runWardInputContract>;
