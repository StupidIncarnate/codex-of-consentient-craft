/**
 * PURPOSE: Defines the data `populateOneRootLayerBroker` returns
 *
 * USAGE:
 * populateOneRootLayerResultContract.parse(value);
 * // Returns validated PopulateOneRootLayerResult
 */
import { z } from '#gateway/npm/zod';
import { worktreeRootPairContract } from '../worktree-root-pair/worktree-root-pair-contract';

export const populateOneRootLayerResultContract = z
  .object({ workspacePackageRoots: z.array(worktreeRootPairContract).readonly() })
  .brand<'PopulateOneRootLayerResult'>();

export type PopulateOneRootLayerResult = z.infer<typeof populateOneRootLayerResultContract>;
