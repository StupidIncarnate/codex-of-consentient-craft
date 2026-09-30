/**
 * PURPOSE: Lists the pids of every process listening on a TCP port, via `lsof -ti :<port>`. Reach
 * for this before `#gateway/bin/kill`'s `killPid` — the two are always used as a pair, never
 * independently, but stay two modules per the one-module-per-program rule. The function that
 * combines them is `portKillListenersBroker` in `@dungeonmaster/shared`.
 *
 * `lsof`'s own "nothing is listening" case exits non-zero with empty output — a normal RESOLVED
 * result from `lsofRun`, treated as "nothing listening", the common and legitimate case. A missing
 * `lsof` binary instead makes `lsofRun` THROW `LsofNotInstalledError`, so the two are told apart by
 * whether it resolves or rejects, never by pattern-matching the resolved shape.
 *
 * USAGE:
 * const pids = await listeningPids({ port: 3737 });
 * // Returns [12345], or [] when nothing is listening; throws LsofNotInstalledError when lsof itself
 * // is missing
 */

import { lsofRun } from '../lsof-run/lsof-run';

// `lsof -ti :<port>` reads no path off the working directory — a port is a machine-global
// resource, so any fixed anchor is equivalent. `lsofRun` requires a cwd; '/' is the neutral one.
const CWD = '/';

export const listeningPids = async ({ port }: { port: number }): Promise<number[]> => {
  // Inlined at each use (never hoisted to a top-level const) because enforce-magic-arrays forbids
  // a pure string-literal array declaration outside statics/tests/stubs/proxies.
  const result = await lsofRun({ args: ['-ti', `:${String(port)}`], cwd: CWD });

  if (result.exitCode !== 0) {
    return [];
  }

  return result.output
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => Number.parseInt(line, 10))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
};
