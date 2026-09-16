/**
 * PURPOSE: Validates input for the `siegelense-kill` MCP tool — the one instance to stop. Accepts an
 * already-dead instance's id too (spec line 1172): that is how a session reaps an orphan it can see
 * in `status`, so this contract carries no liveness constraint of its own — only the SHAPE of an
 * instance id.
 *
 * USAGE:
 * siegelenseKillInputContract.parse({ instanceId: 'inst_7f3a9c21' });
 * // Returns SiegelenseKillInput
 */

import { z } from 'zod';

import { instanceIdContract } from '@dungeonmaster/siegelense/contracts';

export const siegelenseKillInputContract = z
  .object({
    instanceId: instanceIdContract.describe('The instance to stop'),
  })
  .strict();

export type SiegelenseKillInput = z.infer<typeof siegelenseKillInputContract>;
