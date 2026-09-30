/**
 * PURPOSE: Defines the data `runExecuteStepLayerBroker` returns
 *
 * USAGE:
 * runExecuteStepLayerResultContract.parse(value);
 * // Returns validated RunExecuteStepLayerResult
 */
import { z } from '#gateway/npm/zod';
import { stepReadingContract } from '../step-reading/step-reading-contract';
import { stoppedAtContract } from '../stopped-at/stopped-at-contract';

export const runExecuteStepLayerResultContract = z
  .object({
    reading: stepReadingContract,
    stoppedAt: stoppedAtContract.nullable(),
    timedOut: z.boolean(),
  })
  .brand<'RunExecuteStepLayerResult'>();

export type RunExecuteStepLayerResult = z.infer<typeof runExecuteStepLayerResultContract>;
