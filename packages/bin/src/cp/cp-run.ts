/**
 * PURPOSE: The one call every other file in this folder makes into `@dungeonmaster/node/child_process`.
 * Centralizes the `cp`-not-installed detection — see `cp-not-installed-error.ts`'s header.
 *
 * USAGE:
 * const { exitCode, output } = await cpRun({ args: ['-a', '/src', '/dest'], cwd: '/repo' });
 */

import { run } from '@dungeonmaster/node/child_process';

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
  const result = await run({ command: 'cp', args, cwd });

  if (result.exitCode === 1 && result.output === '' && result.signal === null && !result.timedOut) {
    throw new CpNotInstalledError(
      `cp ${args.join(' ')} produced no output and exit code 1 in ${cwd} — cp is likely not installed or not on PATH`,
    );
  }

  return result;
};
