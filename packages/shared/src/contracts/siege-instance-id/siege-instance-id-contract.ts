/**
 * PURPOSE: Identifies which siegelense driver instance walked a path, for the `instanceId` a
 * `walked` quest note carries. `@dungeonmaster/siegelense` mints and owns the real format
 * (`packages/siegelense/src/contracts/instance-id/instance-id-contract.ts`) — this is a SEPARATE
 * brand carrying the identical shape, not an import of it, because `contracts/` here is read by
 * every package and siegelense is a leaf that depends on shared, never the other way round. A
 * resolver reading a `walked` note (`prune`, `cleanup`) re-parses this value through siegelense's
 * own `instanceIdContract` before comparing it against a live registry id — the standard move for
 * carrying a branded value across a package boundary.
 *
 * USAGE:
 * siegeInstanceIdContract.parse('inst_7f3a9c21');
 * // Returns a branded SiegeInstanceId
 */

import { z } from 'zod';

export const siegeInstanceIdContract = z
  .string()
  .regex(
    /^inst_[0-9a-f]{4,}$/u,
    'Siege instance id must look like "inst_" followed by 4 or more lowercase hex characters, e.g. "inst_7f3a9c21"',
  )
  .brand<'SiegeInstanceId'>();

export type SiegeInstanceId = z.infer<typeof siegeInstanceIdContract>;
