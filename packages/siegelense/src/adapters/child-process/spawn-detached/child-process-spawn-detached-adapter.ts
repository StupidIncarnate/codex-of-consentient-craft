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

  return {
    pid: processIdContract.parse(String(pid)),
    pgid: processGroupIdContract.parse(pid),
  };
};
