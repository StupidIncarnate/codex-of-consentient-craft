/**
 * PURPOSE: Spawns a subprocess and streams stdout line-by-line via callback while accumulating full output
 *
 * USAGE:
 * const result = await childProcessSpawnStreamLinesAdapter({ command: 'npm', args: ['run', 'ward'], cwd: '/project', onLine: (line) => emit(line) });
 * // Returns { exitCode: ExitCode | null, output: ErrorMessage }
 */

import { createInterface } from 'readline';
import { spawn } from 'child_process';
import {
  errorMessageContract,
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';

export const childProcessSpawnStreamLinesAdapter = async ({
  command,
  args,
  cwd,
  onLine,
  abortSignal,
}: {
  command: string;
  args: string[];
  cwd: AbsoluteFilePath;
  onLine?: (line: string) => void;
  abortSignal?: AbortSignal;
}): Promise<{ exitCode: ExitCode | null; output: ErrorMessage }> =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
      ...(abortSignal === undefined ? {} : { signal: abortSignal }),
    });

    const stdoutChunks: ErrorMessage[] = [];
    const stderrChunks: ErrorMessage[] = [];

    const rl = createInterface({ input: child.stdout });
    rl.on('line', (line: string) => {
      stdoutChunks.push(errorMessageContract.parse(line));
      if (onLine) {
        onLine(line);
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrChunks.push(errorMessageContract.parse(text));
      if (onLine) {
        onLine(text);
      }
    });

    child.on('error', (error: Error) => {
      rl.close();
      const combined = [...stdoutChunks, ...stderrChunks].join('\n');
      const output = errorMessageContract.parse(combined);
      const exitCode = exitCodeContract.parse(
        'code' in error && typeof error.code === 'number' ? error.code : 1,
      );
      resolve({ exitCode, output });
    });

    child.on('close', (code: number | null) => {
      rl.close();
      const combined = [...stdoutChunks, ...stderrChunks].join('\n');
      const output = errorMessageContract.parse(combined);
      const normalizedCode = code === null ? null : Math.max(0, code);
      const exitCode = normalizedCode === null ? null : exitCodeContract.parse(normalizedCode);
      resolve({ exitCode, output });
    });
  });
