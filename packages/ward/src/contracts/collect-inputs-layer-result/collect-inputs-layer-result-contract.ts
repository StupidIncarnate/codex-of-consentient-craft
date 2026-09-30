/**
 * PURPOSE: Defines the data `collectInputsLayerBroker` returns
 *
 * USAGE:
 * collectInputsLayerResultContract.parse(value);
 * // Returns validated CollectInputsLayerResult
 */
import { z } from '#gateway/npm/zod';

export const collectInputsLayerResultContract = z
  .object({
    repoRoot: z.string().brand<'CollectInputsLayerResultRepoRoot'>(),
    relativePaths: z.array(z.string().brand<'CollectInputsLayerResultRelativePaths'>()),
  })
  .brand<'CollectInputsLayerResult'>();

export type CollectInputsLayerResult = z.infer<typeof collectInputsLayerResultContract>;
