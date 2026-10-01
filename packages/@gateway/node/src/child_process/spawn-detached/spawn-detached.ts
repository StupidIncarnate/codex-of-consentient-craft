/**
 * PURPOSE: Spawns a subprocess as its own process-GROUP LEADER (`detached: true`), for a caller
 * whose real target is a grandchild forked via a wrapper (`npm run` → `sh -c` → the real listener)
 * — a signal aimed at the wrapper's own pid never reaches that grandchild. `detached: true` is what
 * makes the negated pid (the `pgid` this hands back) reach the whole tree instead of just the
 * wrapper. Takes `stdoutFd`/`stderrFd` rather than `'pipe'` because the caller's log file outlives
 * any single call here — this wrapper only wires the child's stdio onto an fd the caller owns.
 *
 * USAGE:
 * const { pid, pgid } = spawnDetached({
 *   command: 'npm',
 *   args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
 *   cwd: '/repo',
 *   env: { DUNGEONMASTER_PORT: '34172' },
 *   stdoutFd: 12,
 *   stderrFd: 12,
 * });
 * // Returns { pid: number, pgid: number } — pgid numerically equals pid, because a detached
 * // child is its own process-group leader
 *
 * Reaping this group (checking it is alive, sending it a signal, tolerating one that already
 * exited) is `#gateway/node/process`'s job, not this wrapper's — this file only starts the
 * group and hands back the id a caller signals it by.
 */

import { spawn } from 'child_process';

export const spawnDetached = ({
  command,
  args,
  cwd,
  env,
  stdoutFd,
  stderrFd,
}: {
  command: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  stdoutFd: number;
  stderrFd: number;
}): { pid: number; pgid: number } => {
  const child = spawn(command, args, {
    cwd,
    env,
    detached: true,
    stdio: ['ignore', stdoutFd, stderrFd],
  });

  // A program that fails to start (a missing executable) leaves `pid` undefined and makes Node emit
  // an `'error'` event on a later tick, after the throw below. An `'error'` event with no listener
  // crashes the whole parent process, even when the caller caught that throw. This listener takes
  // the late event; the throw below is the one report of the failure.
  child.on('error', () => {
    // Intentionally empty: the thrown "produced no pid" error already reports a failed start.
  });

  const { pid } = child;
  if (pid === undefined) {
    throw new Error(
      `spawnDetached: spawning "${command}" produced no pid — the process never started`,
    );
  }

  // `detached: true` sets the child's process GROUP; on its own it does not let the parent exit.
  // The ChildProcess handle keeps a reference on the parent's event loop until the child dies, and
  // every caller of this wrapper spawns a long-lived server it does not intend to await here.
  // Nothing reads the handle after this point — only `pid`/`pgid` leave this wrapper, and a failed
  // spawn is caught by the caller's own boot poll rather than by a listener on this object.
  child.unref();

  return { pid, pgid: pid };
};
