/**
 * PURPOSE: Calls dungeonmaster-ward detail command and returns the JSON output
 *
 * USAGE:
 * const result = await wardDetailBroker({ startPath: AbsoluteFilePathStub(), runId: FileNameStub() });
 * // Returns ErrorMessage with JSON output, or null if command fails
 */

import {
  errorMessageContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type FileName,
} from '@dungeonmaster/shared/contracts';
import { run, RunNotFoundError } from '#gateway/node/child_process';

const WARD_COMMAND = 'dungeonmaster-ward';
const JSON_FLAG = '--json';

export const wardDetailBroker = async ({
  startPath,
  runId,
}: {
  startPath: AbsoluteFilePath;
  runId: FileName;
}): Promise<ErrorMessage | null> => {
  const { exitCode, output } = await run({
    command: process.env.WARD_CLI_PATH ?? WARD_COMMAND,
    args: ['detail', runId, JSON_FLAG],
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

  return errorMessageContract.parse(trimmed);
};
