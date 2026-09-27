/**
 * PURPOSE: Sends one line down a unix domain socket and reads one newline-terminated line back.
 * Takes and returns plain strings — the gateway holds no dependency on any caller's own frame
 * contract, so a caller that wants JSON parses the returned line itself and turns a bad parse
 * into its own error.
 *
 * USAGE:
 * const line = await unixSocketRequest({ socketPath: '/tmp/dm-sock/inst.sock', requestLine: '{"kind":"ping"}', timeoutMs: 5000 });
 * // Returns the raw line the peer wrote back, whatever it contains
 */

import { createConnection } from 'net';

export const unixSocketRequest = async ({
  socketPath,
  requestLine,
  timeoutMs,
}: {
  socketPath: string;
  requestLine: string;
  timeoutMs: number;
}): Promise<string> =>
  new Promise((resolve, reject) => {
    const socket = createConnection({ path: socketPath });
    let buffer = '';

    const timer = setTimeout(() => {
      socket.removeAllListeners();
      socket.destroy();
      reject(new Error(`Socket request to ${socketPath} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.on('connect', () => {
      socket.write(`${requestLine}\n`);
    });

    socket.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex === -1) {
        return;
      }
      const line = buffer.slice(0, newlineIndex);

      clearTimeout(timer);
      socket.removeAllListeners();
      socket.destroy();
      resolve(line);
    });

    socket.on('error', (error: Error) => {
      clearTimeout(timer);
      socket.removeAllListeners();
      socket.destroy();
      reject(error);
    });
  });
