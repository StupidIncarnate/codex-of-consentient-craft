/**
 * PURPOSE: Signals one pid via the `kill` binary. Defaults to SIGKILL, sent per pid — the
 * reconciliation this module makes between orchestrator's `processKillByPortAdapter` (SIGKILL,
 * one `kill -9 <pid>` per pid, each independently tolerant of an already-exited pid) and ward's
 * `netKillPortAdapter` (the default signal, one batched `kill <pids...>`, no per-pid tolerance):
 * orchestrator's shape wins, because it already matches `@dungeonmaster/node/process`'s
 * `killGroup` ESRCH-is-not-a-failure convention. A pid that has already exited is not a failure
 * here either — the caller reads `exitCode`/`output` to tell that apart from a real refusal (a
 * permission-denied kill on a pid this process does not own). ward's batched, default-signal
 * callers are the losing side of this reconciliation; see `scrolls/gateway-build/followups.md`.
 *
 * USAGE:
 * await killPid({ pid: 12345 });
 * // Runs `kill -SIGKILL 12345`
 */

import { killRun } from './kill-run';

// Signaling a pid reads no path off the working directory — '/' is the neutral anchor `run`'s
// required cwd needs.
const CWD = '/';

export const killPid = async ({
  pid,
  signal = 'SIGKILL',
}: {
  pid: number;
  signal?: NodeJS.Signals;
}): Promise<{ exitCode: number; output: string }> => {
  const { exitCode, output } = await killRun({
    args: [`-${signal}`, String(pid)],
    cwd: CWD,
  });
  return { exitCode, output };
};
