/**
 * PURPOSE: Defines the data `ResolveCallerRepoRootLayerResponder` returns
 *
 * USAGE:
 * resolveCallerRepoRootLayerResultContract.parse(value);
 * // Returns validated ResolveCallerRepoRootLayerResult
 */
import { z } from '#gateway/npm/zod';
import { callerRepoRootSourceContract } from '../caller-repo-root-source/caller-repo-root-source-contract';

export const resolveCallerRepoRootLayerResultContract = z
  .object({
    repoRoot: z.string().brand<'ResolveCallerRepoRootLayerResultRepoRoot'>(),
    source: callerRepoRootSourceContract,
    configFound: z.boolean(),
  })
  .brand<'ResolveCallerRepoRootLayerResult'>();

export type ResolveCallerRepoRootLayerResult = z.infer<
  typeof resolveCallerRepoRootLayerResultContract
>;
