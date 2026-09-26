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
 */

import { spawn } from 'child_process';

export const stream = async ({
  command,
  args,
  cwd,
  onStderr,
}: {
  command: string;
  args: string[];
  cwd: string;
  onStderr?: (chunk: string) => void;
}): Promise<{ exitCode: number | null; output: string; signal: NodeJS.Signals | null }> =>
  new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: ['inherit', 'pipe', 'pipe'] });

    const stdoutChunks: string[] = [];

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk.toString());
    });

    child.stderr.on('data', (chunk: Buffer) => {
      if (onStderr) {
        onStderr(chunk.toString());
      }
    });

    child.on('error', (error: Error) => {
      const output = stdoutChunks.join('');
      const exitCode = 'code' in error && typeof error.code === 'number' ? error.code : 1;
      resolve({ exitCode, output, signal: null });
    });

    child.on('close', (code, signal) => {
      const output = stdoutChunks.join('');
      const exitCode = code === null ? null : Math.max(0, code);
      resolve({ exitCode, output, signal });
    });
  });
