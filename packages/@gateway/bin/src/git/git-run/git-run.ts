/**
 * PURPOSE: The one call every other file in this folder makes into `#gateway/node/child_process`.
 * Centralizes the `git`-not-installed detection so each git function stays a plain argument builder.
 * `run` throws `RunNotFoundError` when `git` never started (ENOENT and the like) — this catches that
 * specific error and re-throws it as `GitNotInstalledError`, so a caller of `#gateway/bin/git`
 * only ever needs to know this module's own error class.
 *
 * USAGE:
 * const { exitCode, output } = await gitRun({ args: ['rev-parse', 'HEAD'], cwd: '/repo' });
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';

import { GitNotInstalledError } from './git-not-installed.error';

export const gitRun = async ({
  args,
  cwd,
}: {
  args: string[];
  cwd: string;
}): Promise<{
  exitCode: number;
  output: string;
  stdout: string;
  stderr: string;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
}> => {
  try {
    return await run({ command: 'git', args, cwd });
  } catch (error: unknown) {
    if (error instanceof RunNotFoundError) {
      throw new GitNotInstalledError(
        `git ${args.join(' ')} could not start in ${cwd}: ${error.message}`,
      );
    }
    throw error;
  }
};
