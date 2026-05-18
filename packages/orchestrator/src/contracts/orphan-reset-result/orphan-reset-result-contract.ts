/**
 * PURPOSE: Defines the shape returned by questOrphanResetBroker after walking every guild/quest and resetting orphaned in_progress work items
 *
 * USAGE:
 * orphanResetResultContract.parse({ orphansReset: 3 });
 * // Returns: OrphanResetResult — { orphansReset: 3 }
 */

import { z } from 'zod';

export const orphanResetResultContract = z.object({
  orphansReset: z.number().int().nonnegative().brand<'OrphansResetCount'>(),
});

export type OrphanResetResult = z.infer<typeof orphanResetResultContract>;
