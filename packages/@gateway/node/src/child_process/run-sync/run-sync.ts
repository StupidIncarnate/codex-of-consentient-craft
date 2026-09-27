/**
 * PURPOSE: Synchronous equivalent of `run`, for the one caller that cannot free the event loop to
 * await — the testing package's fixture setup, which runs before any test framework hook can go
 * async. Reach for `run` over this everywhere else; a blocking call stalls whatever else shares this
 * process for as long as the command takes.
 *
 * USAGE:
 * const result = runSync({ command: 'npm', args: ['install'], cwd: '/project' });
 * // Returns { exitCode: number, output: string, signal: NodeJS.Signals | null, timedOut: boolean }
 *
 * `execFileSync` throws for every non-success outcome — a real non-zero exit, a signal kill, AND a
 * spawn that never started (ENOENT) — collapsing all three into one catch block. Node's own thrown
 * error tells them apart: a real exit carries a numeric `.status`; a signal kill carries `.signal`
 * with `.status: null`; a spawn failure that never produced a child carries neither, only `.code`
 * (e.g. `'ENOENT'`) — that last shape becomes `RunNotFoundError`, matching `run`'s own behavior, so a
 * caller can no longer mistake "never started" for "ran and produced nothing".
 */

import { execFileSync } from 'child_process';

import { RunNotFoundError } from '../run-not-found.error';

export const runSync = ({
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
}): {
  exitCode: number;
  output: string;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
} => {
  try {
    const stdout = execFileSync(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['inherit', 'pipe', 'pipe'],
      ...(timeout === undefined ? {} : { timeout }),
    });
    return { exitCode: 0, output: stdout.toString(), signal: null, timedOut: false };
  } catch (error: unknown) {
    const errno = error as NodeJS.ErrnoException & {
      status?: number | null;
      signal?: NodeJS.Signals | null;
      stdout?: Buffer | string | null;
      stderr?: Buffer | string | null;
    };
    const output = `${String(errno.stdout ?? '')}${String(errno.stderr ?? '')}`;

    if (typeof errno.status === 'number') {
      return {
        exitCode: Math.max(0, errno.status),
        output,
        signal: errno.signal ?? null,
        timedOut: false,
      };
    }

    if (errno.signal !== undefined && errno.signal !== null) {
      // execFileSync's own `timeout` option kills the child with `signal` itself once the deadline
      // passes — no separate flag comes back from Node, so a signal kill in a call that asked for a
      // timeout IS that timeout firing; nothing else could have sent the child a signal here.
      return { exitCode: 1, output, signal: errno.signal, timedOut: timeout !== undefined };
    }

    throw new RunNotFoundError({ command, code: errno.code, message: errno.message });
  }
};
