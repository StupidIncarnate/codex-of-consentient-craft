/**
 * PURPOSE: Defines the data `runEvidenceComputeTransformer` returns
 *
 * USAGE:
 * runEvidenceComputeContract.parse(value);
 * // Returns validated RunEvidenceCompute
 */
import { z } from '#gateway/npm/zod';
import { siegeRunContract } from '@dungeonmaster/shared/contracts';

export const runEvidenceComputeContract = z
  .object({
    runCount: z.number().brand<'RunEvidenceComputeRunCount'>(),
    latestRunId: siegeRunContract.shape.id.nullable(),
    evidenceComplete: z.boolean(),
  })
  .brand<'RunEvidenceCompute'>();

export type RunEvidenceCompute = z.infer<typeof runEvidenceComputeContract>;
