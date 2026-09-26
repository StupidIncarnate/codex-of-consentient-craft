/**
 * PURPOSE: Spawns a subprocess and hands back the LIVE `ChildProcess` plus its guaranteed-non-null
 * `stdout`, for a caller that parses output as it arrives and needs the process handle itself
 * (to correlate against, or to kill) rather than a captured string. Reach for this over
 * `run`/`stream`/`streamLines` — every one of those resolves only once the process has already
 * exited, which is too late for a caller (the Claude CLI's JSONL stream) that needs lines the
 * moment they land while the process may still run for minutes.
 *
 * USAGE:
 * const { process, stdout } = spawnLive({ command: 'claude', args: ['-p', 'hi'] });
 * // Returns the live ChildProcess and its stdout Readable; stderr follows `stderr` (default 'pipe')
 *
 * A spawn that never starts (ENOENT) still returns a `ChildProcess` synchronously — Node reports
 * the failure asynchronously via an `'error'` event, and its default behavior for an unlistened
 * `'error'` is to crash the whole process. This attaches a listener that logs instead, exactly like
 * `spawnLongLived`'s own gap fix — Node still delivers the same event to a caller's own listener
 * on `result.process`, so nothing here swallows it.
 */

import { spawn, type ChildProcess } from 'child_process';
import type { Readable } from 'stream';

export const spawnLive = ({
  command,
  args,
  cwd,
  env,
  stdin = 'inherit',
  stderr = 'pipe',
  abortSignal,
}: {
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  stdin?: 'inherit' | 'ignore';
  stderr?: 'inherit' | 'pipe';
  abortSignal?: AbortSignal;
}): { process: ChildProcess; stdout: Readable } => {
  const child = spawn(command, args, {
    stdio: [stdin, 'pipe', stderr],
    ...(cwd === undefined ? {} : { cwd }),
    ...(env === undefined ? {} : { env }),
    ...(abortSignal === undefined ? {} : { signal: abortSignal }),
  });

  child.on('error', (error: Error) => {
    process.stderr.write(`[child_process/spawnLive] "${command}" failed to start: ${String(error)}\n`);
  });

  const { stdout } = child;
  if (stdout === null) {
    throw new Error(`spawnLive: "${command}" produced no stdout despite stdio[1] = 'pipe'`);
  }

  return { process: child, stdout };
};
