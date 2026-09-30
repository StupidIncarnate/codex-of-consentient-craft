/**
 * PURPOSE: Builds a valid WorktreePrepareResult for tests
 *
 * USAGE:
 * WorktreePrepareResultStub();
 * // Returns a valid WorktreePrepareResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { worktreePrepareResultContract } from './worktree-prepare-result-contract';
import type { WorktreePrepareResult } from './worktree-prepare-result-contract';

export const WorktreePrepareResultStub = ({
  ...props
}: StubArgument<WorktreePrepareResult> = {}): WorktreePrepareResult =>
  worktreePrepareResultContract.parse({
    baseRef: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
    ...props,
  });
