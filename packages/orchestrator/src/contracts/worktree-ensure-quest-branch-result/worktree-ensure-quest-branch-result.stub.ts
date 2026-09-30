/**
 * PURPOSE: Builds a valid WorktreeEnsureQuestBranchResult for tests
 *
 * USAGE:
 * WorktreeEnsureQuestBranchResultStub();
 * // Returns a valid WorktreeEnsureQuestBranchResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { worktreeEnsureQuestBranchResultContract } from './worktree-ensure-quest-branch-result-contract';
import type { WorktreeEnsureQuestBranchResult } from './worktree-ensure-quest-branch-result-contract';

export const WorktreeEnsureQuestBranchResultStub = ({
  ...props
}: StubArgument<WorktreeEnsureQuestBranchResult> = {}): WorktreeEnsureQuestBranchResult =>
  worktreeEnsureQuestBranchResultContract.parse({ attempted: false, restored: false, ...props });
