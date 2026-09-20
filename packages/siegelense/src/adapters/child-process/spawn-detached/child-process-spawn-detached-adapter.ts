/**
 * PURPOSE: Spawns a lane's server process as its own process-GROUP LEADER (`detached: true`),
 * because `npm run` is a wrapper and the process actually holding the port is a grandchild forked
 * via `sh -c` — a signal aimed at the wrapper's own pid never reaches that grandchild.
 * `detached: true` is what makes the negated pid (the pgid `processKillGroupAdapter` and
 * `processIsAliveAdapter` target) reach the whole tree instead of just the wrapper. Takes
 * `stdoutFd`/`stderrFd` rather than `'pipe'` because a lane's log file outlives any single call
 * here — the caller owns that fd's lifetime, this adapter only wires the child's stdio onto it.
 *
 * USAGE:
 * const { pid, pgid } = childProcessSpawnDetachedAdapter({
 *   command: 'npm',
 *   args: ['run', 'dev:no-watch', '--workspace=@dungeonmaster/server'],
 *   cwd: AbsoluteFilePathStub({ value: '/repo' }),
 *   env: { DUNGEONMASTER_PORT: '34172' },
 *   stdoutFd: 12,
 *   stderrFd: 12,
 * });
 * // Returns { pid: ProcessId, pgid: ProcessGroupId } — pgid numerically equals the OS pid, because
 * // a detached child is its own process-group leader
 */

import { spawn } from 'child_process';
import {
  processIdContract,
  type AbsoluteFilePath,
  type ProcessId,
} from '@dungeonmaster/shared/contracts';

import {
  processGroupIdContract,
  type ProcessGroupId,
} from '../../../contracts/process-group-id/process-group-id-contract';

export const childProcessSpawnDetachedAdapter = ({
  command,
  args,
  cwd,
  env,
  stdoutFd,
  stderrFd,
}: {
  command: string;
  args: string[];
  cwd: AbsoluteFilePath;
  env?: Record<string, string>;
  stdoutFd: number;
  stderrFd: number;
}): { pid: ProcessId; pgid: ProcessGroupId } => {
  const child = spawn(command, args, {
    cwd,
    env,
    detached: true,
    stdio: ['ignore', stdoutFd, stderrFd],
  });

  const { pid } = child;
  if (pid === undefined) {
    throw new Error(
      `childProcessSpawnDetachedAdapter: spawning "${command}" produced no pid — the process never started`,
    );
  }

  // `detached: true` sets the child's process GROUP; on its own it does not let the parent exit.
  // The ChildProcess handle keeps a reference on the parent's event loop until the child dies, and
  // every child spawned here is a long-lived server. Measured without this line: `dungeonmaster
  // siegelense start` printed its manifest at `bootMs: 4269` and the command then sat for over ten
  // minutes, because the driver it had just spawned was still running. Nothing reads the handle
  // after this point — only `pid` and `pgid` leave this adapter, and a failed spawn is caught by
  // the caller's own boot poll rather than by a listener on this object.
  child.unref();

  return {
    pid: processIdContract.parse(String(pid)),
    pgid: processGroupIdContract.parse(pid),
  };
};
