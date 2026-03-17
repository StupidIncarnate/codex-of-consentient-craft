/**
 * PURPOSE: Requests a free port from the OS by binding to port 0 and reading the assigned port
 *
 * USAGE:
 * const port = await netFreePortAdapter();
 * // Returns an OS-assigned NetworkPort (typically 32768-60999 on Linux, 49152-65535 on Windows)
 */

import { createServer } from 'net';
import { networkPortContract, type NetworkPort } from '@dungeonmaster/shared/contracts';

export const netFreePortAdapter = async (): Promise<NetworkPort> =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const address = server.address();
      if (typeof address === 'object' && address !== null) {
        const port = networkPortContract.parse(address.port);
        server.close(() => {
          resolve(port);
        });
      } else {
        server.close(() => {
          reject(new Error('Failed to get assigned port from OS'));
        });
      }
    });
    server.on('error', (error) => {
      reject(new Error(`Failed to bind port 0: ${error.message}`));
    });
  });
