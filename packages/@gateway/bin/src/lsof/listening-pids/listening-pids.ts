/**
 * PURPOSE: Lists the pids of every process listening on a TCP port, via `lsof -ti :<port>`. Reach
 * for this before `#gateway/bin/kill`'s `killPid` — the two are always used as a pair, never
 * independently, but stay two modules per the one-module-per-program rule; see
 * `scrolls/gateway/followup-sustainability.md` item 32 for where a combining function belongs.
 *
 * `lsof`'s own "nothing is listening" case exits non-zero with empty output — a normal RESOLVED
 * result from `run`, treated as "nothing listening", the common and legitimate case. A missing
 * `lsof` binary instead makes `run` THROW `RunNotFoundError`, so the two are told apart by whether
 * `run` resolves or rejects, never by pattern-matching the resolved shape.
 *
 * USAGE:
 * const pids = await listeningPids({ port: 3737 });
 * // Returns [12345], or [] when nothing is listening; throws LsofNotInstalledError when lsof itself
 * // is missing
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';

import { LsofNotInstalledError } from '../lsof-not-installed-error/lsof-not-installed-error';

// `lsof -ti :<port>` reads no path off the working directory — a port is a machine-global
// resource, so any fixed anchor is equivalent. `run` requires a cwd; '/' is the neutral one.
const CWD = '/';

export const listeningPids = async ({ port }: { port: number }): Promise<number[]> => {
  // Inlined at each use (never hoisted to a top-level const) because enforce-magic-arrays forbids
  // a pure string-literal array declaration outside statics/tests/stubs/proxies.
  const result = await run({ command: 'lsof', args: ['-ti', `:${String(port)}`], cwd: CWD }).catch(
    (error: unknown) => {
      if (error instanceof RunNotFoundError) {
        throw new LsofNotInstalledError(
          `lsof -ti :${String(port)} could not start: ${error.message}`,
        );
      }
      throw error;
    },
  );

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
