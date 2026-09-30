/**
 * PURPOSE: Defines the data `pruneAssetsListBroker` returns
 *
 * USAGE:
 * pruneAssetsListResultContract.parse(value);
 * // Returns validated PruneAssetsListResult
 */
import { z } from '#gateway/npm/zod';
import { pruneAssetContract } from '../prune-asset/prune-asset-contract';
import { siegeRunContract } from '@dungeonmaster/shared/contracts';

export const pruneAssetsListResultContract = z
  .object({
    assets: z.array(pruneAssetContract).readonly(),
    runIds: z.array(siegeRunContract.shape.id).readonly(),
  })
  .brand<'PruneAssetsListResult'>();

export type PruneAssetsListResult = z.infer<typeof pruneAssetsListResultContract>;
