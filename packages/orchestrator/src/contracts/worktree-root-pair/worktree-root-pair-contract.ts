/**
 * PURPOSE: Defines the WorktreeRootPair shape that populate-one-root-layer-broker builds
 *
 * USAGE:
 * worktreeRootPairContract.parse(value);
 * // Returns validated WorktreeRootPair
 */
import { z } from '#gateway/npm/zod';

export const worktreeRootPairContract = z
  .object({
    sourceRoot: z.string().brand<'WorktreeRootPairSourceRoot'>(),
    targetRoot: z.string().brand<'WorktreeRootPairTargetRoot'>(),
  })
  .brand<'WorktreeRootPair'>();

export type WorktreeRootPair = z.infer<typeof worktreeRootPairContract>;
