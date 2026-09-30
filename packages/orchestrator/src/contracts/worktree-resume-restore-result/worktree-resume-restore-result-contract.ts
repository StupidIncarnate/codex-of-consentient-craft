/**
 * PURPOSE: Defines the data `worktreeResumeRestoreBroker` returns
 *
 * USAGE:
 * worktreeResumeRestoreResultContract.parse(value);
 * // Returns validated WorktreeResumeRestoreResult
 */
import { z } from '#gateway/npm/zod';

export const worktreeResumeRestoreResultContract = z
  .object({
    restored: z.boolean(),
    currentBranch: z.string().brand<'WorktreeResumeRestoreResultCurrentBranch'>(),
    output: z.string().brand<'WorktreeResumeRestoreResultOutput'>(),
  })
  .brand<'WorktreeResumeRestoreResult'>();

export type WorktreeResumeRestoreResult = z.infer<typeof worktreeResumeRestoreResultContract>;
