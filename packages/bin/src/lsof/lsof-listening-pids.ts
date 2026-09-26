/**
 * PURPOSE: Lists the pids of every process listening on a TCP port, via `lsof -ti :<port>`. Reach
 * for this before `@dungeonmaster/bin/kill`'s `killPid` — the two are always used as a pair, never
 * independently, but stay two modules per the one-module-per-program rule; see
 * `scrolls/gateway-build/followups.md` for where a combining function belongs.
 *
 * `run`'s "not installed" collapse (see `@dungeonmaster/bin/git`'s `git-run.ts` header) is
 * DELIBERATELY not detected here: `lsof`'s own "nothing is listening" case produces the identical
 * shape (`exitCode: 1`, empty output, no signal, not timed out), so there is no way to tell "lsof is
 * missing" from "nothing is on this port" without a change to `run` itself. An empty result is
 * treated as "nothing listening", which is the common and legitimate case.
 *
 * USAGE:
 * const pids = await listeningPids({ port: 3737 });
 * // Returns [12345], or [] when nothing is listening
 */

import { run } from '@dungeonmaster/node/child_process';

// `lsof -ti :<port>` reads no path off the working directory — a port is a machine-global
// resource, so any fixed anchor is equivalent. `run` requires a cwd; '/' is the neutral one.
const CWD = '/';

export const listeningPids = async ({ port }: { port: number }): Promise<number[]> => {
  const { exitCode, output } = await run({
    command: 'lsof',
    args: ['-ti', `:${String(port)}`],
    cwd: CWD,
  });

  if (exitCode !== 0) {
    return [];
  }

  return output
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => Number.parseInt(line, 10))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
};
