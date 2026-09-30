/**
 * PURPOSE: Builds a valid WorktreeDiscardResult for tests
 *
 * USAGE:
 * WorktreeDiscardResultStub();
 * // Returns a valid WorktreeDiscardResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { worktreeDiscardResultContract } from './worktree-discard-result-contract';
import type { WorktreeDiscardResult } from './worktree-discard-result-contract';

export const WorktreeDiscardResultStub = ({
  ...props
}: StubArgument<WorktreeDiscardResult> = {}): WorktreeDiscardResult =>
  worktreeDiscardResultContract.parse({ discarded: false, output: 'sample', ...props });
