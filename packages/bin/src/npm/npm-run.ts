/**
 * PURPOSE: The one call every other file in this folder makes into `@dungeonmaster/node/child_process`.
 * Centralizes the `npm`-not-installed detection — see `@dungeonmaster/bin/git`'s `git-run.ts` header
 * for why an empty output on exit code 1, no signal and no timeout is what tells "npm missing from
 * $PATH" apart from an ordinary npm failure, which always writes something.
 *
 * USAGE:
 * const { exitCode, output } = await npmRun({ args: ['install'], cwd: '/repo' });
 */

import { run } from '@dungeonmaster/node/child_process';

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
  const result = await run({ command: 'npm', args, cwd });

  if (result.exitCode === 1 && result.output === '' && result.signal === null && !result.timedOut) {
    throw new NpmNotInstalledError(
      `npm ${args.join(' ')} produced no output and exit code 1 in ${cwd} — npm is likely not installed or not on PATH`,
    );
  }

  return result;
};
