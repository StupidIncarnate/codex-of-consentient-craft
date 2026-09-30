/**
 * PURPOSE: The MCP input to `siegelense-compare` — one instance and the two run ids inside its
 * timeline to diff (spec line 2354: `compare { instance: 'inst_7f3a', runA: 'run_4', runB: 'run_5'
 * }`). `.strict()` makes `{ instanceA, instanceB }` a parse error naming the stray keys rather than a
 * silently accepted cross-instance form — chunk-03 §3.F: "two runs of one instance share a timeline,
 * which is what an index delta means; two instances share nothing but a spec" (spec line 282). Reach
 * for this over `ResultsQuery`: that one narrows a read across an instance's whole timeline, while
 * this one always names exactly two points on it to diff.
 *
 * USAGE:
 * compareQueryContract.parse({ instanceId: 'inst_7f3a9c21', runA: 'run_4', runB: 'run_5' });
 * // Returns a validated CompareQuery
 */

import { z } from '#gateway/npm/zod';

import { siegeInstanceContract, siegeRunContract } from '@dungeonmaster/shared/contracts';

export const compareQueryContract = z
  .object({
    instanceId: siegeInstanceContract.shape.id,
    runA: siegeRunContract.shape.id,
    runB: siegeRunContract.shape.id,
  })
  .strict().brand<'CompareQuery'>();

export type CompareQuery = z.infer<typeof compareQueryContract>;
