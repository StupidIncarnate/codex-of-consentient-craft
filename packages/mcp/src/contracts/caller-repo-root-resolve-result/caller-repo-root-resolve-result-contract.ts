/**
 * PURPOSE: Defines the data `callerRepoRootResolveBroker` returns
 *
 * USAGE:
 * callerRepoRootResolveResultContract.parse(value);
 * // Returns validated CallerRepoRootResolveResult
 */
import { z } from '#gateway/npm/zod';
import { callerRepoRootSourceContract } from '../caller-repo-root-source/caller-repo-root-source-contract';

export const callerRepoRootResolveResultContract = z
  .object({
    repoRoot: z.string().brand<'CallerRepoRootResolveResultRepoRoot'>(),
    source: callerRepoRootSourceContract,
    configFound: z.boolean(),
  })
  .brand<'CallerRepoRootResolveResult'>();

export type CallerRepoRootResolveResult = z.infer<typeof callerRepoRootResolveResultContract>;
