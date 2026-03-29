/**
 * PURPOSE: Gracefully stops a dev server process by sending SIGTERM then SIGKILL after 5 seconds
 *
 * USAGE:
 * await devServerStopBroker({ process: devServerProcess });
 * // Sends SIGTERM, waits up to 5s, sends SIGKILL if still alive. Fire-and-forget — catches all errors.
 */

import type { childProcessSpawnAdapter } from '../../../adapters/child-process/spawn/child-process-spawn-adapter';

type DevServerProcess = ReturnType<typeof childProcessSpawnAdapter>;

const SIGKILL_DELAY_MS = 5000;

export const devServerStopBroker = async ({
  process: childProcess,
}: {
  process: DevServerProcess;
}): Promise<void> => {
  await new Promise<void>((resolve) => {
    const killTimer = setTimeout(() => {
      childProcess.removeAllListeners('close');
      childProcess.removeAllListeners('error');
      try {
        childProcess.kill('SIGKILL');
      } catch {
        process.stderr.write('[dev-server-stop] SIGKILL failed\n');
      }
      resolve();
    }, SIGKILL_DELAY_MS);

    childProcess.once('close', () => {
      clearTimeout(killTimer);
      resolve();
    });

    childProcess.once('error', () => {
      clearTimeout(killTimer);
      resolve();
    });

    try {
      childProcess.kill('SIGTERM');
    } catch {
      clearTimeout(killTimer);
      childProcess.removeAllListeners('close');
      childProcess.removeAllListeners('error');
      process.stderr.write('[dev-server-stop] SIGTERM failed\n');
      resolve();
    }
  });
};
