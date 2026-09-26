/**
 * PURPOSE: The one call every other file in this folder makes into `@dungeonmaster/node/child_process`.
 * Centralizes the `kill`-not-installed detection — see `kill-not-installed-error.ts`'s header for
 * why that detection is safe for this program specifically.
 *
 * USAGE:
 * const { exitCode, output } = await killRun({ args: ['-SIGKILL', '12345'], cwd: '/repo' });
 */

import { run } from '@dungeonmaster/node/child_process';

import { KillNotInstalledError } from './kill-not-installed-error';

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
  const result = await run({ command: 'kill', args, cwd });

  if (result.exitCode === 1 && result.output === '' && result.signal === null && !result.timedOut) {
    throw new KillNotInstalledError(
      `kill ${args.join(' ')} produced no output and exit code 1 in ${cwd} — kill is likely not installed or not on PATH`,
    );
  }

  return result;
};
