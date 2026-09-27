/**
 * PURPOSE: The one call every other file in this folder makes into `#gateway/node/child_process`.
 * Centralizes the `kill`-not-installed detection — catches `run`'s `RunNotFoundError` and re-throws it
 * as `KillNotInstalledError`, so a caller of `#gateway/bin/kill` only needs this module's own
 * error class.
 *
 * USAGE:
 * const { exitCode, output } = await killRun({ args: ['-SIGKILL', '12345'], cwd: '/repo' });
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';

import { KillNotInstalledError } from '../kill-not-installed-error/kill-not-installed-error';

export const killRun = async ({
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
  try {
    return await run({ command: 'kill', args, cwd });
  } catch (error: unknown) {
    if (error instanceof RunNotFoundError) {
      throw new KillNotInstalledError(
        `kill ${args.join(' ')} could not start in ${cwd}: ${error.message}`,
      );
    }
    throw error;
  }
};
