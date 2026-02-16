/**
 * PURPOSE: Spawns a subprocess and captures stdout and stderr output as a promise
 *
 * USAGE:
 * const result = await childProcessSpawnCaptureAdapter({ command: 'npm', args: ['run', 'test'], cwd: '/project' });
 * // Returns { exitCode: ExitCode | null, output: ErrorMessage }
 */

import { execFile } from 'child_process';
import {
  errorMessageContract,
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';

export const childProcessSpawnCaptureAdapter = async ({
  command,
  args,
  cwd,
}: {
  command: string;
  args: string[];
  cwd: AbsoluteFilePath;
}): Promise<{ exitCode: ExitCode | null; output: ErrorMessage }> =>
  new Promise((resolve) => {
    execFile(command, args, { cwd }, (error, stdout, stderr) => {
      const combinedOutput = errorMessageContract.parse(stdout + stderr);

      if (error && 'code' in error && typeof error.code === 'number') {
        const exitCode = exitCodeContract.parse(error.code);
        resolve({ exitCode, output: combinedOutput });
        return;
      }

      if (error) {
        resolve({ exitCode: exitCodeContract.parse(1), output: combinedOutput });
        return;
      }

      resolve({ exitCode: exitCodeContract.parse(0), output: combinedOutput });
    });
  });
