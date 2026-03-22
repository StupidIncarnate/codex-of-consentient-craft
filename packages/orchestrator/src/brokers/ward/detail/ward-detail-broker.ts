/**
 * PURPOSE: Calls dungeonmaster-ward detail command and returns the JSON output
 *
 * USAGE:
 * const result = await wardDetailBroker({ startPath: AbsoluteFilePathStub(), runId: FileNameStub() });
 * // Returns ErrorMessage with JSON output, or null if command fails
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  errorMessageContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type FileName,
} from '@dungeonmaster/shared/contracts';

const WARD_COMMAND = 'dungeonmaster-ward';
const JSON_FLAG = '--json';

export const wardDetailBroker = async ({
  startPath,
  runId,
}: {
  startPath: AbsoluteFilePath;
  runId: FileName;
}): Promise<ErrorMessage | null> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: process.env.WARD_CLI_PATH ?? WARD_COMMAND,
    args: ['detail', runId, JSON_FLAG],
    cwd: startPath,
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
