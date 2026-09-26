/**
 * PURPOSE: The one call every other file in this folder makes into `@dungeonmaster/node/child_process`.
 * Centralizes the `cp`-not-installed detection — catches `run`'s `RunNotFoundError` and re-throws it
 * as `CpNotInstalledError`, so a caller of `@dungeonmaster/bin/cp` only needs this module's own error
 * class.
 *
 * USAGE:
 * const { exitCode, output } = await cpRun({ args: ['-a', '/src', '/dest'], cwd: '/repo' });
 */

import { run, RunNotFoundError } from '@dungeonmaster/node/child_process';

import { CpNotInstalledError } from './cp-not-installed-error';

export const cpRun = async ({
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
    return await run({ command: 'cp', args, cwd });
  } catch (error: unknown) {
    if (error instanceof RunNotFoundError) {
      throw new CpNotInstalledError(
        `cp ${args.join(' ')} could not start in ${cwd}: ${error.message}`,
      );
    }
    throw error;
  }
};
