/**
 * PURPOSE: Spawns a subprocess and captures stdout and stderr output as a promise
 *
 * USAGE:
 * const result = await childProcessSpawnCaptureAdapter({ command: 'npm', args: ['run', 'test'], cwd: '/project' });
 * // Returns { exitCode: ExitCode | null, output: ErrorMessage }
 */

import { spawn } from 'child_process';
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
  timeout,
  env,
}: {
  command: string;
  args: string[];
  cwd: AbsoluteFilePath;
  timeout?: number;
  env?: Record<string, string>;
}): Promise<{ exitCode: ExitCode | null; output: ErrorMessage }> =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timeoutHandle =
      timeout === undefined
        ? null
        : setTimeout(() => {
            child.kill();
          }, timeout);

    child.on('exit', (code) => {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
      const combinedOutput = errorMessageContract.parse(stdout + stderr);

      if (code !== null && code !== 0) {
        const normalizedCode = Math.max(0, code);
        const exitCode = exitCodeContract.parse(normalizedCode);
        resolve({ exitCode, output: combinedOutput });
        return;
      }

      resolve({ exitCode: exitCodeContract.parse(code ?? 0), output: combinedOutput });
    });

    child.on('error', () => {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
      const combinedOutput = errorMessageContract.parse(stdout + stderr);
      resolve({ exitCode: exitCodeContract.parse(1), output: combinedOutput });
    });
  });
