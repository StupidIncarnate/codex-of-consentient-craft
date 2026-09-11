/**
 * PURPOSE: Runs a subprocess to completion and hands back everything it printed. Reach for this
 * over `childProcessSpawnStreamLinesAdapter` when the caller wants the WHOLE output as one value
 * and has nowhere to put lines while the process is still running.
 *
 * USAGE:
 * const result = await childProcessSpawnCaptureAdapter({ command: 'npm', args: ['run', 'test'], cwd: '/project' });
 * // Returns { exitCode: ExitCode | null, output: ErrorMessage }
 *
 * A child's `exit` fires when the PROCESS ends, which is not when its OUTPUT ends: the last chunks
 * can still be queued on the pipes, so a handler that resolves there loses them — intermittently,
 * and for a short-lived command usually ALL of them. That is invisible at every call site, because
 * an empty capture is indistinguishable from a command that legitimately printed nothing: a `git
 * ls-files` reads as a clean tree, a `git rev-parse` reads as no HEAD. So the exit is awaited and
 * then BOTH stdio streams are awaited to their end before the promise settles.
 *
 * `signal` is REPORTED ALONGSIDE the exit code, never folded into it. A child killed from outside
 * has no exit code of its own, and the `exitCode: 1` this hands back for that case cannot be told
 * apart from a command that chose to fail — which is how an eslint the kernel's out-of-memory
 * reaper SIGKILLed read as ordinary lint errors, with nothing anywhere naming memory. The exit code
 * keeps its existing value so no caller changes behaviour; a caller that needs to know a death was
 * imposed reads `signal`, which is `null` for every process that exited on its own.
 */

import { spawn } from 'child_process';
import {
  errorMessageContract,
  exitCodeContract,
  processSignalContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
  type ProcessSignal,
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
}): Promise<{ exitCode: ExitCode | null; output: ErrorMessage; signal: ProcessSignal | null }> =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });

    let stdout = '';
    let stderr = '';

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

      const killedBy = signal === null ? null : processSignalContract.parse(signal);

      drained
        .then(() => {
          const combinedOutput = errorMessageContract.parse(stdout + stderr);

          if (code === null && signal !== null) {
            resolve({
              exitCode: exitCodeContract.parse(1),
              output: combinedOutput,
              signal: killedBy,
            });
            return;
          }

          if (code !== null && code !== 0) {
            const normalizedCode = Math.max(0, code);
            const exitCode = exitCodeContract.parse(normalizedCode);
            resolve({ exitCode, output: combinedOutput, signal: killedBy });
            return;
          }

          resolve({
            exitCode: exitCodeContract.parse(code ?? 0),
            output: combinedOutput,
            signal: killedBy,
          });
        })
        .catch(() => {
          // A stdio stream can only reject by erroring, and the error handler below already
          // settles this promise with whatever was captured — so there is nothing left to do
          // here, and a rethrow would surface as an unhandled rejection instead.
          resolve({
            exitCode: exitCodeContract.parse(1),
            output: errorMessageContract.parse(stdout + stderr),
            signal: killedBy,
          });
        });
    });

    child.on('error', () => {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
      const combinedOutput = errorMessageContract.parse(stdout + stderr);
      // A spawn that never started has no signal to report — this fires when the command could not
      // be found or the fork failed, both before any process existed to be killed.
      resolve({ exitCode: exitCodeContract.parse(1), output: combinedOutput, signal: null });
    });
  });
