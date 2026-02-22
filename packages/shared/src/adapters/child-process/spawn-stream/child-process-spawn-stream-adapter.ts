/**
 * PURPOSE: Spawns a subprocess using spawn and streams stderr via callback while collecting stdout into a buffer
 *
 * USAGE:
 * const result = await childProcessSpawnStreamAdapter({ command: 'npm', args: ['run', 'test'], cwd: '/project', onStderr: (line) => process.stderr.write(line) });
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

export const childProcessSpawnStreamAdapter = async ({
  command,
  args,
  cwd,
  onStderr,
}: {
  command: string;
  args: string[];
  cwd: AbsoluteFilePath;
  onStderr?: (line: string) => void;
}): Promise<{ exitCode: ExitCode | null; output: ErrorMessage }> =>
  new Promise((resolve) => {
    const child = spawn(command, args, { cwd });

    const stdoutChunks: ErrorMessage[] = [];

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(errorMessageContract.parse(chunk.toString()));
    });

    child.stderr.on('data', (chunk: Buffer) => {
      if (onStderr) {
        onStderr(chunk.toString());
      }
    });

    child.on('error', (error: Error) => {
      const output = errorMessageContract.parse(stdoutChunks.join(''));
      const exitCode = exitCodeContract.parse(
        'code' in error && typeof error.code === 'number' ? error.code : 1,
      );
      resolve({ exitCode, output });
    });

    child.on('close', (code: number | null) => {
      const output = errorMessageContract.parse(stdoutChunks.join(''));
      const exitCode = code === null ? null : exitCodeContract.parse(code);
      resolve({ exitCode, output });
    });
  });
