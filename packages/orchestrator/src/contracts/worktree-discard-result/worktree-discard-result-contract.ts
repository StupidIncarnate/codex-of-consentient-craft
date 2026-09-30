/**
 * PURPOSE: Defines the data `worktreeDiscardBroker` returns
 *
 * USAGE:
 * worktreeDiscardResultContract.parse(value);
 * // Returns validated WorktreeDiscardResult
 */
import { z } from '#gateway/npm/zod';

export const worktreeDiscardResultContract = z
  .object({ discarded: z.boolean(), output: z.string().brand<'WorktreeDiscardResultOutput'>() })
  .brand<'WorktreeDiscardResult'>();

export type WorktreeDiscardResult = z.infer<typeof worktreeDiscardResultContract>;
