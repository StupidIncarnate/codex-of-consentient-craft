/**
 * PURPOSE: Runs a subprocess to completion, blocking, after feeding it `input` on stdin, and hands
 * back its stdout and stderr SEPARATELY. Reach for this when a caller must be synchronous, must talk
 * to the child through stdin, and must tell what it printed on each stream (a hook process is judged
 * by both). `runSync` merges the two into one `output` and gives the child no stdin, and `spawnPiped`
 * is asynchronous.
 *
 * USAGE:
 * const result = runSyncWithInput({ command: 'node', args: ['hook.js'], cwd: '/repo', input: '{"a":1}' });
 * // Returns { status: number | null, stdout: string, stderr: string, signal: NodeJS.Signals | null }
 *
 * `status` is null when a signal ended the child, and `signal` then names it. A spawn that never
 * started (ENOENT) throws `RunNotFoundError`, the same as `run` and `runSync`, so "never started" is
 * not mistaken for "ran and printed nothing".
 */

import { spawnSync } from 'child_process';

import { RunNotFoundError } from '../run-not-found.error';

export const runSyncWithInput = ({
  command,
  args,
  cwd,
  env,
  input,
}: {
  command: string;
  args: string[];
  cwd: string;
  env?: Record<string, string | undefined>;
  input: string;
}): {
  status: number | null;
  stdout: string;
  stderr: string;
  signal: NodeJS.Signals | null;
} => {
  const result = spawnSync(command, args, {
    cwd,
    input,
    encoding: 'utf8',
    ...(env === undefined ? {} : { env }),
  });

  if (result.error !== undefined) {
    const errno: NodeJS.ErrnoException = result.error;
    throw new RunNotFoundError({ command, code: errno.code, message: errno.message });
  }

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    signal: result.signal,
  };
};
