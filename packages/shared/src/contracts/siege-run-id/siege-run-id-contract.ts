/**
 * PURPOSE: Numbers which run within a siegelense instance's timeline walked a path, for the
 * `runId` a `walked` quest note carries. `@dungeonmaster/siegelense` mints and owns the real
 * format (`packages/siegelense/src/contracts/run-id/run-id-contract.ts`) — this is a SEPARATE
 * brand carrying the identical shape, not an import of it, because `contracts/` here is read by
 * every package and siegelense is a leaf that depends on shared, never the other way round. A
 * resolver reading a `walked` note (`prune`, `cleanup`) re-parses this value through siegelense's
 * own `runIdContract` before comparing it against that instance's recorded runs.
 *
 * USAGE:
 * siegeRunIdContract.parse('run_2');
 * // Returns a branded SiegeRunId
 */

import { z } from 'zod';

export const siegeRunIdContract = z
  .string()
  .regex(
    /^run_[1-9][0-9]*$/u,
    'Siege run id must look like "run_" followed by a positive integer with no leading zero, e.g. "run_2"',
  )
  .brand<'SiegeRunId'>();

export type SiegeRunId = z.infer<typeof siegeRunIdContract>;
