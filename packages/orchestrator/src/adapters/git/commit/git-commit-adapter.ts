/**
 * PURPOSE: `git commit -m <message>`, optionally `--allow-empty` — the deterministic `commit`
 * step's second verb, after `gitAddAllAdapter`. Reports the exit code, never throws — the same
 * shape `gitPushAdapter` already sets, so the caller decides what a failed commit means rather
 * than the adapter deciding for it.
 *
 * USAGE:
 * await gitCommitAdapter({ cwd, message: 'codeweaver/work: add auth' });
 * // Runs `git commit -m "codeweaver/work: add auth"`
 *
 * await gitCommitAdapter({ cwd, message: 'ward/commit: repair', allowEmpty: true });
 * // Runs `git commit -m "..." --allow-empty` — a pass that legitimately changed nothing still
 * // leaves a commit for the next step to stand on
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';

export const gitCommitAdapter = async ({
  cwd,
  message,
  allowEmpty,
}: {
  cwd: AbsoluteFilePath;
  message: string;
  allowEmpty?: boolean;
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  const args = ['commit', '-m', message, ...(allowEmpty === true ? ['--allow-empty'] : [])];

  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args,
    cwd,
  });

  return { exitCode: exitCode ?? exitCodeContract.parse(1), output };
};
