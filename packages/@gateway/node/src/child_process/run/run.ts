/**
 * PURPOSE: Runs a subprocess to completion and hands back everything it printed, as plain values —
 * no zod contracts, since this file IS the boundary those contracts would otherwise wrap. Reach
 * for this over `stream`/`streamLines` when the caller wants the whole output as one value once the
 * process exits. `onStdout`/`onStderr` add a live view of a run still in flight, for a caller that
 * narrates progress while it waits for that whole result.
 *
 * USAGE:
 * const result = await run({ command: 'npm', args: ['run', 'test'], cwd: '/project' });
 * await run({ command: 'node', args: ['cli.js'], cwd: '/project', stdin: 'ignore', onStdout: (chunk) => show(chunk), onStderr: (chunk) => show(chunk) });
 * // Returns { exitCode: number, output: string, stdout: string, stderr: string, signal: NodeJS.Signals | null, timedOut: boolean }
 *
 * `stdout` and `stderr` are each decoded ONCE, from that stream's concatenated bytes. Decoding
 * chunk by chunk corrupts a multi-byte UTF-8 character the pipe happens to split across two
 * chunks. `output` is `stdout` followed by `stderr`, for a caller that shows a human everything the
 * command printed. A caller that PARSES what the command printed reads `stdout`: a warning the
 * command writes to stderr during a successful run would otherwise land inside the parsed value.
 *
 * `onStdout` and `onStderr` receive each stream's text as it arrives, decoded through a
 * `StringDecoder`, so a multi-byte character split across two chunks reaches the callback whole.
 * Joined, the text one callback receives equals that stream's field in the result. Every callback
 * has fired before the promise settles.
 *
 * `stdin` defaults to `'inherit'`. A caller with no terminal to hand the child (a desktop app, a
 * background job) passes `'ignore'`, so the child reads end-of-input instead of waiting on a
 * stdin nobody writes to.
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
 * process, because no process ever existed. This THROWS `RunNotFoundError` instead, so a missing
 * program never reads as a real command that exits 1 and prints nothing.
 */

import { spawn } from 'child_process';
import { StringDecoder } from 'string_decoder';

import { RunNotFoundError } from '../run-not-found.error';

export const run = async ({
  command,
  args,
  cwd,
  timeout,
  env,
  stdin = 'inherit',
  onStdout,
  onStderr,
}: {
  command: string;
  args: string[];
  cwd: string;
  timeout?: number;
  env?: Record<string, string>;
  stdin?: 'inherit' | 'ignore';
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
}): Promise<{
  exitCode: number;
  output: string;
  stdout: string;
  stderr: string;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
}> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: [stdin, 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const stdoutDecoder = new StringDecoder('utf8');
    const stderrDecoder = new StringDecoder('utf8');
    let timedOut = false;

    const stdoutStream = child.stdout;
    const stderrStream = child.stderr;

    stdoutStream.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);
      if (onStdout) {
        const text = stdoutDecoder.write(chunk);
        if (text !== '') {
          onStdout(text);
        }
      }
    });

    stderrStream.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
      if (onStderr) {
        const text = stderrDecoder.write(chunk);
        if (text !== '') {
          onStderr(text);
        }
      }
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
          // A stream that ended on an incomplete multi-byte sequence leaves bytes in its decoder.
          // `end()` hands them over (as U+FFFD, the same as the joined decode below gives them).
          const stdoutTail = stdoutDecoder.end();
          if (onStdout && stdoutTail !== '') {
            onStdout(stdoutTail);
          }
          const stderrTail = stderrDecoder.end();
          if (onStderr && stderrTail !== '') {
            onStderr(stderrTail);
          }

          const stdout = Buffer.concat(stdoutChunks).toString('utf8');
          const stderr = Buffer.concat(stderrChunks).toString('utf8');
          const decoded = { output: stdout + stderr, stdout, stderr };

          if (code === null && signal !== null) {
            resolve({ exitCode: 1, ...decoded, signal, timedOut });
            return;
          }

          const normalizedCode = code === null ? 0 : Math.max(0, code);
          resolve({ exitCode: normalizedCode, ...decoded, signal, timedOut });
        })
        .catch(() => {
          // A stdio stream can only reject by erroring, and the error handler below already
          // settles this promise with whatever was captured — so there is nothing left to do
          // here, and a rethrow would surface as an unhandled rejection instead.
          const stdout = Buffer.concat(stdoutChunks).toString('utf8');
          const stderr = Buffer.concat(stderrChunks).toString('utf8');
          resolve({ exitCode: 1, output: stdout + stderr, stdout, stderr, signal, timedOut });
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
