/**
 * PURPOSE: Defines the siege run object whose `id` every contract and function that holds one reuses
 *
 * USAGE:
 * siegeRunContract.parse({ id: 'run_1' });
 * // Returns: SiegeRun object
 */

import { z } from '#gateway/npm/zod';

export const siegeRunContract = z
  .object({
    id: z.string().regex(/^run_[1-9][0-9]*$/u, 'Siege run id must look like "run_" followed by a positive integer with no leading zero, e.g. "run_2"',).brand<'SiegeRunId'>(),
  })
  .brand<'SiegeRun'>();

export type SiegeRun = z.infer<typeof siegeRunContract>;
