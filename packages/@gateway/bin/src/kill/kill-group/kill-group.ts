/**
 * PURPOSE: Signals a whole process GROUP via the `kill` binary's negated-pid form — for a pgid this
 * process does not hold a live handle for (one discovered externally), as opposed to
 * `#gateway/node/process`'s `killGroup`, which signals a group through Node's own
 * `process.kill()` for a child this process spawned itself. Defaults to SIGKILL, matching
 * `killPid`'s own default.
 *
 * USAGE:
 * await killGroup({ pgid: 12345 });
 * // Runs `kill -SIGKILL -12345`
 */

import { killRun } from '../kill-run/kill-run';

// Signaling a process group reads no path off the working directory — '/' is the neutral anchor
// `run`'s required cwd needs.
const CWD = '/';

export const killGroup = async ({
  pgid,
  signal = 'SIGKILL',
}: {
  pgid: number;
  signal?: NodeJS.Signals;
}): Promise<{ exitCode: number; output: string }> => {
  const { exitCode, output } = await killRun({
    args: [`-${signal}`, `-${pgid}`],
    cwd: CWD,
  });
  return { exitCode, output };
};
