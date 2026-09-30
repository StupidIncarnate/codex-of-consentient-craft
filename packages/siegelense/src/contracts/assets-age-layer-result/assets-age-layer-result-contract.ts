/**
 * PURPOSE: Defines the data `assetsAgeLayerBroker` returns
 *
 * USAGE:
 * assetsAgeLayerResultContract.parse(value);
 * // Returns validated AssetsAgeLayerResult
 */
import { z } from '#gateway/npm/zod';
import { pruneRefusalContract } from '../prune-refusal/prune-refusal-contract';
import { citationGapContract } from '../citation-gap/citation-gap-contract';

export const assetsAgeLayerResultContract = z
  .object({
    instances: z.number().brand<'AssetsAgeLayerResultInstances'>(),
    freedMB: z.number().brand<'AssetsAgeLayerResultFreedMB'>(),
    refusals: z.array(pruneRefusalContract).readonly(),
    gaps: z.array(citationGapContract).readonly(),
  })
  .brand<'AssetsAgeLayerResult'>();

export type AssetsAgeLayerResult = z.infer<typeof assetsAgeLayerResultContract>;
