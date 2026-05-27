/**
 * PURPOSE: Defines the input schema for the MCP run-ward tool /dumpster-launch calls when get-next-step returns a `run-ward` step
 *
 * USAGE:
 * runWardInputContract.parse({ questId, workItemId, mode: 'changed' });
 * // Returns: validated RunWardInput
 */
import { z } from 'zod';

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

export const runWardInputContract = z
  .object({
    questId: questIdContract.describe('Quest the ward run is associated with'),
    workItemId: questWorkItemIdContract.describe('Work item the ward run is being executed for'),
    mode: z
      .enum(['changed', 'full'])
      .describe(
        'Ward run scope — `changed` runs against git-changed files; `full` runs the full monorepo',
      ),
  })
  .strict();

export type RunWardInput = z.infer<typeof runWardInputContract>;
