/**
 * PURPOSE: The payload a siegemaster piece carries — the one path a round walks by hand, and the
 * off-map family that round is allocated. Reach for this over the other two payloads when the piece's
 * deliverable is a WALK against a running system rather than a file: there is nothing to write, so
 * there is no file list and no per-unit row.
 *
 * USAGE:
 * workPlanPayloadSiegemasterContract.parse({
 *   path: { nodeIds: ['queue-has-entries', 'batch-sent'], branchLabels: ['1 or more queued'] },
 *   offMapFamily: 'hostile-input',
 * });
 * // Returns: WorkPlanPayloadSiegemaster
 *
 * THIS PAYLOAD DECLARES NO `units` KEY, and that absence is what switches off the 1:1 check
 * `workPlanContract` runs over the other two families: a siege piece's unit IS the walk (or the
 * family), both already named by the piece's own `assignedUnitIds` and by `offMapFamily`, so there is
 * nothing separate to cross-check it against. Codeweaver's and flowrider's `units[]` exist precisely
 * because a FILE or a SPEC can silently drop a unit no test was ever written for.
 *
 * `offMapFamily` reuses `qaOffMapFamilyContract` rather than declaring a second seven-member enum: a
 * repeated or invented family destroys a round's coverage, and `hostile-input` and `perf` are the
 * quest's only security and performance coverage anywhere.
 *
 * NO LANE OR INSTANCE NAMES. The router starts each instance and serves its id, so a lane named at
 * plan time would be a lane nothing allocated.
 */

import { qaOffMapFamilyContract, qaWalkPathContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const workPlanPayloadSiegemasterContract = z.object({
  path: qaWalkPathContract,
  offMapFamily: qaOffMapFamilyContract
    .nullable()
    .describe('The one probe family this round attacks, or null when the round attacks none.'),
});

export type WorkPlanPayloadSiegemaster = z.infer<typeof workPlanPayloadSiegemasterContract>;
