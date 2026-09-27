/**
 * PURPOSE: The one call every other file in this folder makes into `#gateway/node/child_process`.
 * Centralizes the `lsof`-not-installed detection — catches `run`'s `RunNotFoundError` and re-throws it
 * as `LsofNotInstalledError`, so a caller of `#gateway/bin/lsof` only needs this module's own error
 * class. The message omits `cwd` (unlike `gitRun`/`npmRun`/`killRun`/`cpRun`, which name it): every
 * caller passes the same fixed anchor, since `lsof -ti :<port>` reads no path off the working
 * directory, so naming that constant would only add noise, not information.
 *
 * USAGE:
 * const { exitCode, output } = await lsofRun({ args: ['-ti', ':3737'], cwd: '/' });
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';

import { LsofNotInstalledError } from './lsof-not-installed.error';

export const lsofRun = async ({
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
    return await run({ command: 'lsof', args, cwd });
  } catch (error: unknown) {
    if (error instanceof RunNotFoundError) {
      throw new LsofNotInstalledError(`lsof ${args.join(' ')} could not start: ${error.message}`);
    }
    throw error;
  }
};
