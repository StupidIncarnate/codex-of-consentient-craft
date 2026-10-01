/**
 * PURPOSE: Calls dungeonmaster-ward detail command and returns the JSON output. The ward it runs is the
 * one installed nearest `startPath` (dungeonmasterBinResolveBroker), so a run's detail is read by the
 * same ward that saved it.
 *
 * USAGE:
 * const result = await wardDetailBroker({ startPath: '/home/user/project/src/file.ts', runId: FileNameStub() });
 * // Returns ErrorMessage with JSON output, or null if command fails
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';
import { getEnv } from '#gateway/node/process';

import { dungeonmasterBinResolveBroker } from '../../dungeonmaster-bin/resolve/dungeonmaster-bin-resolve-broker';

const WARD_COMMAND = 'dungeonmaster-ward';
const JSON_FLAG = '--json';

export const wardDetailBroker = async ({
  startPath,
  runId,
}: {
  startPath: string;
  runId: string;
}): Promise<string | null> => {
  const override = getEnv('WARD_CLI_PATH');
  const ward =
    override === undefined
      ? await dungeonmasterBinResolveBroker({ binName: WARD_COMMAND, cwd: startPath })
      : { command: override, leadingArgs: [] };
  const { exitCode, output } = await run({
    command: ward.command,
    args: [...ward.leadingArgs, 'detail', runId, JSON_FLAG],
    cwd: startPath,
  }).catch((error: unknown) => {
    if (!(error instanceof RunNotFoundError)) {
      throw error;
    }
    // A missing `dungeonmaster-ward` binary rejects `run` with RunNotFoundError rather than
    // resolving a result — folded into the same failed-run shape the old spawn-capture adapter
    // resolved for an ENOENT, so the exit-code check right below still reports null.
    return { exitCode: 1, output: '', signal: null, timedOut: false };
  });

  if (exitCode !== 0) {
    return null;
  }

  const trimmed = output.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    JSON.parse(trimmed);
  } catch {
    return null;
  }

  return trimmed;
};
