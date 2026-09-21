/**
 * PURPOSE: `git add -A`, staging every change in the worktree — tracked edits and untracked
 * additions alike — ahead of a deterministic `commit` step's `git commit`. A pass's own files are
 * never enumerated: the step covers whatever the whole pass touched, exactly as the reviewer's
 * bare `git add -A` already does today.
 *
 * USAGE:
 * await gitAddAllAdapter({ cwd });
 * // Runs `git add -A` from that checkout, returns the exit code and output rather than throwing
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';

export const gitAddAllAdapter = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['add', '-A'],
    cwd,
  });

  return { exitCode: exitCode ?? exitCodeContract.parse(1), output };
};
