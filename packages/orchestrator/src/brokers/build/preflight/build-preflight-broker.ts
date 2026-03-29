/**
 * PURPOSE: Runs a build command and captures its combined output to determine success or failure
 *
 * USAGE:
 * const result = await buildPreflightBroker({ buildCommand: 'npm run build', cwd: '/project' });
 * // Returns { success: boolean; output: ErrorMessage; exitCode: ExitCode }
 */

import {
  errorMessageContract,
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';
import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';

export const buildPreflightBroker = async ({
  buildCommand,
  cwd,
}: {
  buildCommand: string;
  cwd: AbsoluteFilePath;
}): Promise<{ success: boolean; output: ErrorMessage; exitCode: ExitCode }> => {
  const parts = buildCommand.split(' ').filter(Boolean);
  const [command, ...args] = parts;

  if (command === undefined) {
    return {
      success: false,
      output: errorMessageContract.parse('Build command is empty'),
      exitCode: exitCodeContract.parse(1),
    };
  }

  const { exitCode: rawExitCode, output } = await childProcessSpawnCaptureAdapter({
    command,
    args,
    cwd,
  });

  const exitCode = rawExitCode ?? exitCodeContract.parse(1);
  const success = exitCode === 0;

  return { success, output, exitCode };
};
