/**
 * PURPOSE: Validates input for the `siegelense-compare` MCP tool — one instance and the two run ids
 * inside its own timeline to diff. `.strict()` makes `{ instanceA, instanceB }` a parse error naming
 * the stray keys rather than a silently accepted cross-instance form: two runs of one instance share
 * a timeline, which is what an index delta means, and two instances share nothing but a spec.
 *
 * USAGE:
 * siegelenseCompareInputContract.parse({ instanceId: 'inst_7f3a9c21', runA: 'run_4', runB: 'run_5' });
 * // Returns SiegelenseCompareInput
 */

import { z } from 'zod';

import { instanceIdContract, runIdContract } from '@dungeonmaster/siegelense/contracts';

export const siegelenseCompareInputContract = z
  .object({
    instanceId: instanceIdContract.describe('The instance both runs belong to'),
    runA: runIdContract.describe('The earlier run in the diff'),
    runB: runIdContract.describe('The later run in the diff'),
  })
  .strict();

export type SiegelenseCompareInput = z.infer<typeof siegelenseCompareInputContract>;
