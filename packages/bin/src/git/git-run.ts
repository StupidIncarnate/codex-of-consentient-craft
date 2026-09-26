/**
 * PURPOSE: The one call every other file in this folder makes into `@dungeonmaster/node/child_process`.
 * Centralizes the `git`-not-installed detection so each git function stays a plain argument builder.
 * `run` turns a missing `git` binary into `{exitCode: 1, output: '', signal: null, timedOut: false}`
 * — the SAME shape a real git failure that happens to print nothing produces — but a real git
 * failure always writes SOMETHING to stderr (a "fatal:" line at minimum), so an empty output on
 * exit code 1 with no signal and no timeout is git missing from `$PATH`, not git refusing the
 * command.
 *
 * USAGE:
 * const { exitCode, output } = await gitRun({ args: ['rev-parse', 'HEAD'], cwd: '/repo' });
 */

import { run } from '@dungeonmaster/node/child_process';

import { GitNotInstalledError } from './git-not-installed-error';

export const gitRun = async ({
  args,
  cwd,
}: {
  args: string[];
  cwd: string;
}): Promise<{
  exitCode: number;
  output: string;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
}> => {
  const result = await run({ command: 'git', args, cwd });

  if (result.exitCode === 1 && result.output === '' && result.signal === null && !result.timedOut) {
    throw new GitNotInstalledError(
      `git ${args.join(' ')} produced no output and exit code 1 in ${cwd} — git is likely not installed or not on PATH`,
    );
  }

  return result;
};
