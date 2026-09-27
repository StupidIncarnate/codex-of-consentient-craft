/**
 * PURPOSE: Checks whether a specific TCP port is currently free by attempting to bind a
 * throwaway server to it. Reach for this over a raw `net.createServer` probe so every caller
 * gets the same bind-refusal handling — `EADDRINUSE`/`EACCES` read as "not free" rather than an
 * uncaught error.
 *
 * USAGE:
 * const free = await isPortFree({ port: 4173 });
 * // Returns true if the port was bindable, false if a bind error (e.g. EADDRINUSE) was raised
 */

import { createServer } from 'net';

export const isPortFree = async ({ port }: { port: number }): Promise<boolean> =>
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
