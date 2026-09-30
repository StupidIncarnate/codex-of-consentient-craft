/**
 * PURPOSE: Builds a valid WorktreePrepareResult for tests
 *
 * USAGE:
 * WorktreePrepareResultStub();
 * // Returns a valid WorktreePrepareResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { worktreePrepareResultContract } from './worktree-prepare-result-contract';
import type { WorktreePrepareResult } from './worktree-prepare-result-contract';

export const WorktreePrepareResultStub = ({
  ...props
}: StubArgument<WorktreePrepareResult> = {}): WorktreePrepareResult =>
  worktreePrepareResultContract.parse({ baseRef: QuestStub().baseRef, ...props });
