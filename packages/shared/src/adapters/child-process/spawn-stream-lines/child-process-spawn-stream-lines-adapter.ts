/**
 * PURPOSE: Spawns a subprocess and streams stdout line-by-line via callback while accumulating full output
 *
 * USAGE:
 * const result = await childProcessSpawnStreamLinesAdapter({ command: 'npm', args: ['run', 'ward'], cwd: '/project', onLine: (line) => emit(line) });
 * // Returns { exitCode: ExitCode | null, output: ErrorMessage }
 *
 * `onLine` is REQUIRED — deliberately, not for convenience. This adapter is the only place a
 * long-running subprocess's output exists while it is still running; `output` is not resolved
 * until the process exits, so a caller that omits the callback has silently chosen "no live
 * output" for a process that may run for minutes. That is invisible at the call site: the code
 * compiles, the command runs, the result is correct, and the only symptom is a UI that shows
 * nothing. Ward shipped exactly that way. Making the parameter required forces every caller to
 * answer "where does this go?" — pass `() => undefined` to opt out and the choice is on the page.
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
  // Required. See the PURPOSE block — an optional streaming callback drops live output silently.
  onLine: (line: string) => void;
  abortSignal?: AbortSignal;
}): Promise<{ exitCode: ExitCode | null; output: ErrorMessage }> =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env },
      ...(abortSignal === undefined ? {} : { signal: abortSignal }),
    });

    const stdoutChunks: ErrorMessage[] = [];
    const stderrChunks: ErrorMessage[] = [];

    // readline and the stderr stream call these handlers outside any caller frame, so a throwing
    // `onLine` is an uncaught exception that kills the process — losing the accumulated output
    // and the exit code of a command that may have run for minutes. Log and keep streaming: the
    // subprocess result is still worth resolving when one line's consumer failed.
    const rl = createInterface({ input: child.stdout });
    rl.on('line', (line: string) => {
      stdoutChunks.push(errorMessageContract.parse(line));
      try {
        onLine(line);
      } catch (lineError: unknown) {
        process.stderr.write(
          `[spawn-stream-lines] onLine failed for ${command} stdout: ${String(lineError)}\n`,
        );
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrChunks.push(errorMessageContract.parse(text));
      try {
        onLine(text);
      } catch (lineError: unknown) {
        process.stderr.write(
          `[spawn-stream-lines] onLine failed for ${command} stderr: ${String(lineError)}\n`,
        );
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
