/**
 * PURPOSE: Reach for this — never assemble a `git worktree add` invocation elsewhere — because
 * the invariant that the worktree starts from the base branch's committed tip (never `HEAD`,
 * never a path) lives entirely in this one argument order. Duplicating the call risks a caller
 * silently starting the worktree from the working tree instead of the branch, which would leak
 * the repo root's uncommitted edits onto the quest branch.
 *
 * USAGE:
 * const { exitCode, output } = await gitWorktreeAddAdapter({
 *   cwd: AbsoluteFilePathStub({ value: '/project' }),
 *   worktreePath: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
 *   branchName: QuestBranchNameStub({ value: 'quest/foo-7bc21741' }),
 *   baseBranch: BaseBranchNameStub({ value: 'main' }),
 * });
 * // Runs `git worktree add <worktreePath> -b <branchName> <baseBranch>`
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  exitCodeContract,
  type AbsoluteFilePath,
  type BaseBranchName,
  type ErrorMessage,
  type ExitCode,
  type QuestBranchName,
} from '@dungeonmaster/shared/contracts';

export const gitWorktreeAddAdapter = async ({
  cwd,
  worktreePath,
  branchName,
  baseBranch,
}: {
  cwd: AbsoluteFilePath;
  worktreePath: AbsoluteFilePath;
  branchName: QuestBranchName;
  baseBranch: BaseBranchName;
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['worktree', 'add', worktreePath, '-b', branchName, baseBranch],
    cwd,
  });

  return { exitCode: exitCode ?? exitCodeContract.parse(1), output };
};
