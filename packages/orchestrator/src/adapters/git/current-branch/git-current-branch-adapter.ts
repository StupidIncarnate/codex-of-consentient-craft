/**
 * PURPOSE: Reach for this over gitVerifyRefAdapter or gitHeadShaAdapter when the question is "what
 * branch is the worktree checked out to right now" — resume's drift check compares this against the
 * quest's own branch name before any agent re-enters the worktree, and `--abbrev-ref HEAD` is the one
 * invocation that answers with a branch name (not a ref-existence boolean or a commit sha), printing
 * the literal string `HEAD` when the worktree is detached rather than throwing.
 *
 * USAGE:
 * const { exitCode, output } = await gitCurrentBranchAdapter({
 *   cwd: AbsoluteFilePathStub({ value: '/project/worktrees/foo-7bc21741' }),
 * });
 * // Runs `git rev-parse --abbrev-ref HEAD`; output is the trimmed branch name it printed
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  errorMessageContract,
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';

export const gitCurrentBranchAdapter = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['rev-parse', '--abbrev-ref', 'HEAD'],
    cwd,
  });

  return {
    exitCode: exitCode ?? exitCodeContract.parse(1),
    output: errorMessageContract.parse(output.trim()),
  };
};
