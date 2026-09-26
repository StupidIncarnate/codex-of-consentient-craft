/**
 * PURPOSE: The one call every other file in this folder makes into `@dungeonmaster/node/child_process`.
 * Centralizes the `npm`-not-installed detection — catches `run`'s `RunNotFoundError` and re-throws it
 * as `NpmNotInstalledError`, so a caller of `@dungeonmaster/bin/npm` only needs this module's own
 * error class.
 *
 * USAGE:
 * const { exitCode, output } = await npmRun({ args: ['install'], cwd: '/repo' });
 */

import { run, RunNotFoundError } from '@dungeonmaster/node/child_process';

import { NpmNotInstalledError } from './npm-not-installed-error';

export const npmRun = async ({
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
    return await run({ command: 'npm', args, cwd });
  } catch (error: unknown) {
    if (error instanceof RunNotFoundError) {
      throw new NpmNotInstalledError(
        `npm ${args.join(' ')} could not start in ${cwd}: ${error.message}`,
      );
    }
    throw error;
  }
};
