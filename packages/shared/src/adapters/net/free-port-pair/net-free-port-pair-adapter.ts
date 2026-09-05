/**
 * PURPOSE: Hands a caller two ports it can bind side by side, for a run that needs an API server
 * and a web server at once. Both sockets are held open together while the ports are read, so two
 * callers racing each other can never be handed the same port, and neither port is derived from
 * the other by arithmetic. The window between close and bind still exists — this narrows the race
 * rather than removing it, and a caller that loses should fail loudly rather than reuse a server.
 *
 * USAGE:
 * const { firstPort, secondPort } = await netFreePortPairAdapter();
 * // Returns two distinct OS-assigned NetworkPorts, both free at the moment they were read
 */

import { createServer } from 'net';
import { networkPortContract, type NetworkPort } from '@dungeonmaster/shared/contracts';

export const netFreePortPairAdapter = async (): Promise<{
  firstPort: NetworkPort;
  secondPort: NetworkPort;
}> =>
  new Promise((resolve, reject) => {
    const first = createServer();
    const second = createServer();

    first.on('error', (error) => {
      reject(new Error(`Failed to bind port 0: ${error.message}`));
    });
    second.on('error', (error) => {
      reject(new Error(`Failed to bind port 0: ${error.message}`));
    });

    first.listen(0, () => {
      second.listen(0, () => {
        const firstAddress = first.address();
        const secondAddress = second.address();

        if (
          typeof firstAddress !== 'object' ||
          firstAddress === null ||
          typeof secondAddress !== 'object' ||
          secondAddress === null
        ) {
          first.close(() => {
            second.close(() => {
              reject(new Error('Failed to get assigned ports from OS'));
            });
          });
          return;
        }

        // Read BOTH ports while BOTH sockets are still bound. Reading and closing one before
        // binding the other is what lets the OS hand the same port out twice.
        const firstPort = networkPortContract.parse(firstAddress.port);
        const secondPort = networkPortContract.parse(secondAddress.port);

        first.close(() => {
          second.close(() => {
            resolve({ firstPort, secondPort });
          });
        });
      });
    });
  });
