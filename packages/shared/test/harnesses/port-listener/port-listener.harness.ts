/**
 * PURPOSE: Starts a real listener on a free port for port-kill-listeners-broker.integration.test.ts.
 * The listener is a CHILD node process, because the broker sends SIGKILL to whatever holds the port
 * and a listener opened inside the test process would kill the test runner itself. The child also exits on
 * its own after a minute, so a test that fails before the broker runs strands nothing.
 *
 * USAGE:
 * const harness = portListenerHarness();
 * const port = await harness.start();
 * await harness.waitForPortState({ port, free: true }); // polls until the port is bindable
 */
import { spawnLongLived } from '#gateway/node/child_process';
import { freePortPair, isPortFree } from '#gateway/node/net';
import { cwd as getCwd } from '#gateway/node/process';
import { setTimeout as delay } from '#gateway/node/setTimeout';

const POLL_MS = 50;
const MAX_ATTEMPTS = parseInt('200', 10);

export const portListenerHarness = (): {
  freePort: () => Promise<number>;
  start: () => Promise<number>;
  waitForPortState: (params: { port: number; free: boolean }) => Promise<boolean>;
} => {
  const waitForPortState = async ({
    port,
    free,
    attemptsLeft = MAX_ATTEMPTS,
  }: {
    port: number;
    free: boolean;
    attemptsLeft?: typeof MAX_ATTEMPTS;
  }): Promise<boolean> => {
    if ((await isPortFree({ port })) === free) {
      return true;
    }
    if (attemptsLeft <= 0) {
      return false;
    }
    await new Promise<void>((resolve) => {
      delay(resolve, POLL_MS);
    });
    return waitForPortState({ port, free, attemptsLeft: attemptsLeft - 1 });
  };

  const freePort = async (): Promise<number> => {
    const { firstPort } = await freePortPair();
    return firstPort;
  };

  return {
    freePort,
    waitForPortState: async ({ port, free }) => waitForPortState({ port, free }),
    start: async (): Promise<number> => {
      const port = await freePort();
      spawnLongLived({
        command: 'node',
        args: [
          '-e',
          `require('net').createServer().listen(${String(port)});setTimeout(()=>process.exit(0),60000)`,
        ],
        cwd: getCwd(),
      });
      return port;
    },
  };
};
