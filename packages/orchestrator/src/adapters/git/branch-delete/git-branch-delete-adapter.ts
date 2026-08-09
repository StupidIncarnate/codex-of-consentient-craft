/**
 * PURPOSE: Reach for this over `git branch -d` (lowercase) — a quest branch being torn down may
 * hold commits that were never merged back to the base branch, and `-D` is the only form that
 * removes it unconditionally instead of git refusing on an unmerged-changes safety check.
 *
 * USAGE:
 * const { exitCode, output } = await gitBranchDeleteAdapter({
 *   cwd: AbsoluteFilePathStub({ value: '/project' }),
 *   branchName: QuestBranchNameStub({ value: 'quest/foo-7bc21741' }),
 * });
 * // Runs `git branch -D <branchName>`
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
  type QuestBranchName,
} from '@dungeonmaster/shared/contracts';

export const gitBranchDeleteAdapter = async ({
  cwd,
  branchName,
}: {
  cwd: AbsoluteFilePath;
  branchName: QuestBranchName;
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['branch', '-D', branchName],
    cwd,
  });

  return { exitCode: exitCode ?? exitCodeContract.parse(1), output };
};
