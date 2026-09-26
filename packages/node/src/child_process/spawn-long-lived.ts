/**
 * PURPOSE: Spawns a long-lived subprocess (a dev server, a driver) and returns a `kill` function
 * without waiting for exit — the caller is not blocked on a process that is meant to keep running.
 *
 * USAGE:
 * const { kill } = spawnLongLived({ command: 'npx', args: ['vite'], cwd: '/path' });
 * kill(); // Sends SIGTERM to the subprocess, once
 *
 * A spawn that fails to start (ENOENT) still returns a `ChildProcess`, and Node's default behavior
 * for an unlistened `'error'` event is to crash the whole process — so this attaches a listener
 * that logs instead, closing the gap the adapter this replaces shipped with (nothing reported that
 * the process never started).
 */

import { spawn } from 'child_process';

export const spawnLongLived = ({
  command,
  args,
  cwd,
}: {
  command: string;
  args: string[];
  cwd: string;
}): { kill: () => void } => {
  const child = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    detached: false,
  });

  child.on('error', (error: Error) => {
    process.stderr.write(
      `[child_process/spawnLongLived] "${command}" failed to start: ${String(error)}\n`,
    );
  });

  return {
    kill: (): void => {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    },
  };
};
