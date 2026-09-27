/**
 * PURPOSE: Runs a subprocess to completion and hands back everything it printed, as plain values —
 * no zod contracts, since this file IS the boundary those contracts would otherwise wrap. Reach
 * for this over `stream`/`streamLines` when the caller wants the whole output as one value and has
 * nowhere to put lines while the process is still running.
 *
 * USAGE:
 * const result = await run({ command: 'npm', args: ['run', 'test'], cwd: '/project' });
 * // Returns { exitCode: number, output: string, signal: NodeJS.Signals | null, timedOut: boolean }
 *
 * A child's `exit` fires when the PROCESS ends, which is not when its OUTPUT ends: the last chunks
 * can still be queued on the pipes, so a handler that resolves there loses them — intermittently,
 * and for a short-lived command usually ALL of them. Both stdio streams are awaited to their own
 * end/close before the promise settles.
 *
 * `signal` is reported ALONGSIDE the exit code, never folded into it: a child killed from outside
 * has no exit code of its own, and the `exitCode: 1` this hands back for that case is otherwise
 * indistinguishable from a command that chose to fail — which is how an out-of-memory SIGKILL reads
 * as an ordinary lint failure if nothing names it. `timedOut` is a plain flag for the one signal
 * kill this wrapper causes itself (the `timeout` param firing `child.kill()`), so a caller does not
 * have to guess whether a `SIGTERM` came from us or from outside.
 *
 * A process that never STARTED at all (spawn's own `'error'` event — ENOENT, a non-executable file)
 * is not a result to resolve — it has no exit code, no signal, nothing that happened inside a
 * process, because no process ever existed. This THROWS `RunNotFoundError` instead of resolving
 * `{exitCode: 1, output: '', signal: null}`, which used to be indistinguishable from a real command
 * that exits 1 and prints nothing.
 */

import { spawn } from 'child_process';

import { RunNotFoundError } from '../run-not-found-error/run-not-found-error';

export const run = async ({
  command,
  args,
  cwd,
  timeout,
  env,
}: {
  command: string;
  args: string[];
  cwd: string;
  timeout?: number;
  env?: Record<string, string>;
}): Promise<{
  exitCode: number;
  output: string;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
}> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const stdoutStream = child.stdout;
    const stderrStream = child.stderr;

    stdoutStream.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    stderrStream.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timeoutHandle =
      timeout === undefined
        ? null
        : setTimeout(() => {
            timedOut = true;
            child.kill();
          }, timeout);

    // Both pipes read to their end BEFORE any exit is reported. `end` is the readable's own
    // "nothing more is coming" event; `close` covers a stream torn down without one (a killed
    // child), so neither shape can leave this promise pending.
    const drained = Promise.all([
      new Promise<void>((endResolve) => {
        stdoutStream.on('end', () => {
          endResolve();
        });
        stdoutStream.on('close', () => {
          endResolve();
        });
      }),
      new Promise<void>((endResolve) => {
        stderrStream.on('end', () => {
          endResolve();
        });
        stderrStream.on('close', () => {
          endResolve();
        });
      }),
    ]);

    child.on('exit', (code, signal) => {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }

      drained
        .then(() => {
          const output = stdout + stderr;

          if (code === null && signal !== null) {
            resolve({ exitCode: 1, output, signal, timedOut });
            return;
          }

          const normalizedCode = code === null ? 0 : Math.max(0, code);
          resolve({ exitCode: normalizedCode, output, signal, timedOut });
        })
        .catch(() => {
          // A stdio stream can only reject by erroring, and the error handler below already
          // settles this promise with whatever was captured — so there is nothing left to do
          // here, and a rethrow would surface as an unhandled rejection instead.
          resolve({ exitCode: 1, output: stdout + stderr, signal, timedOut });
        });
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
      // A spawn that never started has no exit result to resolve — this fires when the command
      // could not be found or the fork failed, both before any process existed to be killed.
      reject(new RunNotFoundError({ command, code: error.code, message: error.message }));
    });
  });
