/**
 * PURPOSE: Spawns a subprocess and streams BOTH stdout (line-by-line, via readline) and stderr
 * (per chunk) through one `onLine` callback, while accumulating the full combined output for the
 * caller that only cares once the process exits.
 *
 * USAGE:
 * const result = await streamLines({ command: 'npm', args: ['run', 'ward'], cwd: '/project', onLine: (line) => emit(line) });
 * // Returns { exitCode: number | null, output: string, signal: NodeJS.Signals | null }
 *
 * `onLine` is REQUIRED — deliberately, not for convenience. This wrapper is the only place a
 * long-running subprocess's output exists while it is still running; `output` does not resolve
 * until the process exits, so a caller that omits the callback has silently chosen "no live
 * output" for a process that may run for minutes. That is invisible at the call site: the code
 * compiles, the command runs, the result is correct, and the only symptom is a UI that shows
 * nothing. Pass `() => undefined` to opt out explicitly — then the choice is on the page.
 *
 * `signal` comes off the `close` event's own second argument, same reasoning as `stream`'s header.
 *
 * A spawn that never started (`'error'`) throws `RunNotFoundError` rather than resolving
 * `{exitCode: 1, ...}` — the same fix `run` and `stream` get, for the same reason.
 */

import { createInterface } from 'readline';
import { spawn } from 'child_process';

import { RunNotFoundError } from './run-not-found-error';

export const streamLines = async ({
  command,
  args,
  cwd,
  onLine,
  abortSignal,
}: {
  command: string;
  args: string[];
  cwd: string;
  // Required. See the PURPOSE block — an optional streaming callback drops live output silently.
  onLine: (line: string) => void;
  abortSignal?: AbortSignal;
}): Promise<{ exitCode: number | null; output: string; signal: NodeJS.Signals | null }> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env },
      ...(abortSignal === undefined ? {} : { signal: abortSignal }),
    });

    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];

    // readline and the stderr stream call these handlers outside any caller frame, so a throwing
    // `onLine` is an uncaught exception that kills the process — losing the accumulated output
    // and the exit code of a command that may have run for minutes. Log and keep streaming: the
    // subprocess result is still worth resolving when one line's consumer failed.
    const rl = createInterface({ input: child.stdout });
    rl.on('line', (line: string) => {
      stdoutChunks.push(line);
      try {
        onLine(line);
      } catch (lineError: unknown) {
        process.stderr.write(
          `[child_process/streamLines] onLine failed for ${command} stdout: ${String(lineError)}\n`,
        );
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrChunks.push(text);
      try {
        onLine(text);
      } catch (lineError: unknown) {
        process.stderr.write(
          `[child_process/streamLines] onLine failed for ${command} stderr: ${String(lineError)}\n`,
        );
      }
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      rl.close();
      reject(new RunNotFoundError({ command, code: error.code, message: error.message }));
    });

    child.on('close', (code, signal) => {
      rl.close();
      const output = [...stdoutChunks, ...stderrChunks].join('\n');
      const exitCode = code === null ? null : Math.max(0, code);
      resolve({ exitCode, output, signal });
    });
  });
