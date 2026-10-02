/**
 * PURPOSE: Spawns a subprocess, forwards stderr live line-by-chunk via `onStderr`, and buffers
 * stdout until exit. Reach for this over `run` when a caller needs stderr AS IT HAPPENS (a progress
 * indicator) but has nowhere ongoing to put stdout, and over `streamLines` when stdout only matters
 * once the process is done.
 *
 * USAGE:
 * const result = await stream({ command: 'npm', args: ['run', 'build'], cwd: '/project', onStderr: (line) => process.stderr.write(line) });
 * // Returns { exitCode: number | null, output: string, signal: NodeJS.Signals | null }
 *
 * `signal` comes straight off the `close` event's own second argument — a child killed by a signal
 * has no exit code of its own, and reporting it alongside `exitCode` (rather than dropping it, as
 * this wrapper's predecessor did) is what lets a caller tell a SIGKILL apart from a `code: null`
 * it cannot otherwise explain.
 *
 * `onSpawn` notifies the caller of the child's process ID as soon as it is spawned. The child
 * stays in the parent's process group (not detached) so interrupts and termination signals reach it.
 *
 * A spawn that never started (`'error'`) throws `RunNotFoundError` rather than resolving
 * `{exitCode: 1, ...}` — the same fix `run` gets, for the same reason: that shape is indistinguishable
 * from a real command that exits 1 and prints nothing.
 */

import { spawn } from 'child_process';

import { RunNotFoundError } from '../run-not-found.error';

export const stream = async ({
  command,
  args,
  cwd,
  onStderr,
  onSpawn,
}: {
  command: string;
  args: string[];
  cwd: string;
  onStderr?: (chunk: string) => void;
  onSpawn?: ({ pid }: { pid: number }) => void;
}): Promise<{ exitCode: number | null; output: string; signal: NodeJS.Signals | null }> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['inherit', 'pipe', 'pipe'] });

    if (onSpawn && child.pid !== undefined) {
      onSpawn({ pid: child.pid });
    }

    const stdoutChunks: string[] = [];

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk.toString());
    });

    child.stderr.on('data', (chunk: Buffer) => {
      if (onStderr) {
        onStderr(chunk.toString());
      }
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      reject(new RunNotFoundError({ command, code: error.code, message: error.message }));
    });

    child.on('close', (code, signal) => {
      const output = stdoutChunks.join('');
      const exitCode = code === null ? null : Math.max(0, code);
      resolve({ exitCode, output, signal });
    });
  });
