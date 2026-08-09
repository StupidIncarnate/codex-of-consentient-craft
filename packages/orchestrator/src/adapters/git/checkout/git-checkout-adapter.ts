/**
 * PURPOSE: Reach for this over `git checkout -f`, `-B`, or a pathspec checkout (`git checkout --
 * <path>`) — resume must put the worktree back on the quest branch WITHOUT touching the uncommitted
 * edits a killed agent left behind, and passing only `[branchName]` (never `-f`, `--force`, `-B`,
 * `--`, or a path argument) is what keeps a dirty working tree intact instead of being
 * force-overwritten or partially reverted.
 *
 * USAGE:
 * const { exitCode, output } = await gitCheckoutAdapter({
 *   cwd: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
 *   branchName: QuestBranchNameStub({ value: 'quest/foo-7bc21741' }),
 * });
 * // Runs `git checkout <branchName>`
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
  type QuestBranchName,
} from '@dungeonmaster/shared/contracts';

export const gitCheckoutAdapter = async ({
  cwd,
  branchName,
}: {
  cwd: AbsoluteFilePath;
  branchName: QuestBranchName;
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['checkout', branchName],
    cwd,
  });

  return { exitCode: exitCode ?? exitCodeContract.parse(1), output };
};
