/**
 * PURPOSE: Listens on a unix domain socket and dispatches each newline-terminated line to
 * `onRequestLine`, writing its resolved string back the same way. `mkdir -p`s the socket's
 * parent directory before touching it — `net.Server.listen()` against a path whose parent
 * directory does not exist rejects `EACCES`, not the `ENOENT` you would expect. Unlinks a stale
 * socket file before binding, since a peer that died uncleanly leaves its socket file behind and
 * a fresh `listen()` against it fails `EADDRINUSE`.
 *
 * USAGE:
 * const { close } = await unixSocketServe({ socketPath: '/tmp/dm-sock/inst.sock', onRequestLine: async (line) => line });
 * // Resolves once the socket is listening; close() stops accepting new connections
 */

import { createServer } from 'net';
import { dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

export const unixSocketServe = async ({
  socketPath,
  onRequestLine,
}: {
  socketPath: string;
  onRequestLine: (line: string) => Promise<string>;
}): Promise<{ close: () => Promise<void> }> =>
  new Promise((resolve, reject) => {
    mkdirSync(dirname(socketPath), { recursive: true });

    if (existsSync(socketPath)) {
      unlinkSync(socketPath);
    }

    const server = createServer((socket) => {
      let buffer = '';

      socket.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        const newlineIndex = buffer.indexOf('\n');
        if (newlineIndex === -1) {
          return;
        }
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        onRequestLine(line)
          .then((responseLine) => {
            socket.end(`${responseLine}\n`);
          })
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            socket.end(`ERROR: ${message}\n`);
          });
      });
    });

    server.on('error', (error: Error) => {
      reject(error);
    });

    server.listen(socketPath, () => {
      resolve({
        close: async (): Promise<void> =>
          new Promise((resolveClose) => {
            server.close(() => {
              resolveClose();
            });
          }),
      });
    });
  });
