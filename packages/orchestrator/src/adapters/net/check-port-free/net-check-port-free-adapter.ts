/**
 * PURPOSE: Checks whether a specific TCP port is currently free by attempting to bind a server to it
 *
 * USAGE:
 * const free = await netCheckPortFreeAdapter({ port });
 * // Returns: true if the port was bindable (free), false if EADDRINUSE was raised.
 *
 * WHEN-TO-USE: Smoketest teardown verification needs to confirm that the dev-server port was released after
 * siegemaster shut down. Pair with a short retry loop at the caller if the OS TIME_WAIT window is a concern.
 * WHEN-NOT-TO-USE: Production code. This adapter opens and closes a server purely to probe availability.
 */

import { createServer } from 'net';

import type { NetworkPort } from '@dungeonmaster/shared/contracts';

export const netCheckPortFreeAdapter = async ({ port }: { port: NetworkPort }): Promise<boolean> =>
  new Promise((resolve) => {
    const server = createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port);
  });
