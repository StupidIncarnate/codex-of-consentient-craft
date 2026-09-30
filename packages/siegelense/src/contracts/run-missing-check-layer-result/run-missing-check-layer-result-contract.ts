/**
 * PURPOSE: Defines the data `runMissingCheckLayerBroker` returns
 *
 * USAGE:
 * runMissingCheckLayerResultContract.parse(value);
 * // Returns validated RunMissingCheckLayerResult
 */
import { z } from '#gateway/npm/zod';

export const runMissingCheckLayerResultContract = z
  .object({
    storedReturnContent: z
      .string()
      .brand<'RunMissingCheckLayerResultStoredReturnContent'>()
      .nullable(),
  })
  .brand<'RunMissingCheckLayerResult'>();

export type RunMissingCheckLayerResult = z.infer<typeof runMissingCheckLayerResultContract>;
