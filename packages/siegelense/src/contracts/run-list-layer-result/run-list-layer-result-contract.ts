/**
 * PURPOSE: Defines the data `runListLayerBroker` returns
 *
 * USAGE:
 * runListLayerResultContract.parse(value);
 * // Returns validated RunListLayerResult
 */
import { z } from '#gateway/npm/zod';
import { siegeRunContract } from '@dungeonmaster/shared/contracts';

export const runListLayerResultContract = z
  .object({
    runCount: z.number().brand<'RunListLayerResultRunCount'>(),
    latestRunId: siegeRunContract.shape.id.nullable(),
    evidenceComplete: z.boolean(),
  })
  .brand<'RunListLayerResult'>();

export type RunListLayerResult = z.infer<typeof runListLayerResultContract>;
