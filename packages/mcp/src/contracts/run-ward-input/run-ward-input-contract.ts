/**
 * PURPOSE: Defines the input schema for the MCP run-ward tool /dumpster-launch calls when get-next-step returns a `run-ward` step
 *
 * USAGE:
 * runWardInputContract.parse({ questId, workItemId, mode: 'committed' });
 * // Returns: validated RunWardInput
 */
import { z } from 'zod';

import {
  questIdContract,
  questWorkItemIdContract,
  wardModeContract,
} from '@dungeonmaster/shared/contracts';

export const runWardInputContract = z
  .object({
    questId: questIdContract.describe('Quest the ward run is associated with'),
    workItemId: questWorkItemIdContract.describe('Work item the ward run is being executed for'),
    mode: wardModeContract.describe(
      'Ward run scope — `committed` runs against the files this branch has committed on top of origin; `full` runs the full monorepo',
    ),
  })
  .strict();

export type RunWardInput = z.infer<typeof runWardInputContract>;
