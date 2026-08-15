/**
 * PURPOSE: Reach for this — never assemble a `git worktree add` invocation elsewhere — because
 * the invariant that a CREATED worktree starts from the base branch's committed tip (never `HEAD`,
 * never a path) lives entirely in this one argument order. Duplicating the call risks a caller
 * silently starting the worktree from the working tree instead of the branch, which would leak
 * the repo root's uncommitted edits onto the quest branch.
 *
 * Two modes, because a quest's worktree is carved more than once over its life. `create-branch`
 * mints the branch (`-b`) at `baseBranch`'s tip — the first carve. `attach-existing` checks the
 * branch out as it stands, and is what makes a re-carve possible after the directory is deleted
 * out from under a quest whose branch already holds its commits; passing `-b` there would refuse
 * with "already exists" and there would be no way back. `baseBranch` names the fork point for
 * `create-branch` ONLY — an existing branch carries its own tip and git is never told one.
 *
 * USAGE:
 * const { exitCode, output } = await gitWorktreeAddAdapter({
 *   cwd: AbsoluteFilePathStub({ value: '/project' }),
 *   worktreePath: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
 *   branchName: QuestBranchNameStub({ value: 'quest/foo-7bc21741' }),
 *   baseBranch: BaseBranchNameStub({ value: 'main' }),
 *   mode: 'create-branch',
 * });
 * // Runs `git worktree add <worktreePath> -b <branchName> <baseBranch>`, or
 * //   `git worktree add <worktreePath> <branchName>` under 'attach-existing'
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
  mode,
}: {
  cwd: AbsoluteFilePath;
  worktreePath: AbsoluteFilePath;
  branchName: QuestBranchName;
  baseBranch: BaseBranchName;
  mode: 'create-branch' | 'attach-existing';
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  const args =
    mode === 'create-branch'
      ? ['worktree', 'add', worktreePath, '-b', branchName, baseBranch]
      : ['worktree', 'add', worktreePath, branchName];

  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args,
    cwd,
  });

  return { exitCode: exitCode ?? exitCodeContract.parse(1), output };
};
