/**
 * PURPOSE: Defines the data `worktreeEnsureQuestBranchBroker` returns
 *
 * USAGE:
 * worktreeEnsureQuestBranchResultContract.parse(value);
 * // Returns validated WorktreeEnsureQuestBranchResult
 */
import { z } from '#gateway/npm/zod';

export const worktreeEnsureQuestBranchResultContract = z
  .object({ attempted: z.boolean(), restored: z.boolean() })
  .brand<'WorktreeEnsureQuestBranchResult'>();

export type WorktreeEnsureQuestBranchResult = z.infer<
  typeof worktreeEnsureQuestBranchResultContract
>;
