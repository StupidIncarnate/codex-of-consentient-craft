/**
 * PURPOSE: Builds a valid WorktreeResumeRestoreResult for tests
 *
 * USAGE:
 * WorktreeResumeRestoreResultStub();
 * // Returns a valid WorktreeResumeRestoreResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { worktreeResumeRestoreResultContract } from './worktree-resume-restore-result-contract';
import type { WorktreeResumeRestoreResult } from './worktree-resume-restore-result-contract';

export const WorktreeResumeRestoreResultStub = ({
  ...props
}: StubArgument<WorktreeResumeRestoreResult> = {}): WorktreeResumeRestoreResult =>
  worktreeResumeRestoreResultContract.parse({
    restored: false,
    currentBranch: 'sample',
    output: 'sample',
    ...props,
  });
