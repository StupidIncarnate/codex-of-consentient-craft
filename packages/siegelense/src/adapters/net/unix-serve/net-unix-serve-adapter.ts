/**
 * PURPOSE: Listens on a unix domain socket and dispatches each newline-terminated request frame to
 * `onRequest`, writing its resolved response back the same way — the server half of the
 * thin-client-over-a-socket design (siegelense-tooling.md line 1616). `mkdir -p`s the socket's
 * parent directory before touching it, since nothing else in this package ever creates
 * `dm-siege-sockets` under the OS tmpdir — measured directly: `net.Server.listen()` against a path
 * whose parent directory does not exist rejects with `EACCES`, not the `ENOENT` you would expect,
 * which is what made this read as intermittent cross-process contention before the missing mkdir was
 * found. Unlinks a stale socket file before binding, since a driver that was SIGKILLed leaves its
 * socket file behind and a fresh `listen()` against it fails EADDRINUSE. A request frame that fails
 * `driverRequestContract.safeParse` — malformed JSON, or valid JSON missing a required field — never
 * reaches `onRequest`; the caller on the other end of the socket gets a real `{ok:false,...}` frame
 * back instead of a connection that silently never answers. Every reply is written through
 * `socket.end()`, never a bare `socket.write()`: this protocol is one request per connection (the
 * client side, `netUnixRequestAdapter`, opens one connection, writes one frame, reads one frame,
 * then destroys itself), so the server proactively ending its own writable side the moment the
 * reply is queued is correct rather than leaving that half-close to the client's own `.destroy()` —
 * measured directly: `_getActiveHandles()` still listed that connection's `Socket`, with a pending
 * `ShutdownWrap`, several event-loop turns after the peer had already torn its own end down, before
 * ending server-side too.
 *
 * The resolved value also carries `close`, because the LISTENING handle itself keeps this process's
 * event loop open independently of any one connection — nothing else in this package ever calls
 * `server.close()`, so a caller with no handle to the server has no way to let its own process exit
 * once the driver's serving job is done. `close()` only stops NEW connections from being accepted;
 * it never touches one already accepted, so calling it costs an in-flight reply nothing, however
 * soon after the write it runs.
 *
 * USAGE:
 * const { close } = await netUnixServeAdapter({
 *   socketPath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock' }),
 *   onRequest: async ({ request }) => driverHandleRequestBroker({ request }),
 * });
 * // Resolves { success: true, close } once the socket is listening
 * await close(); // Stops accepting connections; resolves once every open one has ended
 */

import { createServer } from 'net';
import { dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { driverRequestContract } from '../../../contracts/driver-request/driver-request-contract';
import type { DriverRequest } from '../../../contracts/driver-request/driver-request-contract';
import type { DriverResponse } from '../../../contracts/driver-response/driver-response-contract';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

export const netUnixServeAdapter = async ({
  socketPath,
  onRequest,
}: {
  socketPath: AbsoluteFilePath;
  onRequest: (args: { request: DriverRequest }) => Promise<DriverResponse>;
}): Promise<AdapterResult & { close: () => Promise<void> }> =>
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

        try {
          const parsedUnknown: unknown = JSON.parse(line);
          const parsedRequest = driverRequestContract.safeParse(parsedUnknown);

          if (!parsedRequest.success) {
            socket.end(
              `${JSON.stringify({
                ok: false,
                payload: '',
                error: `Malformed request frame: ${parsedRequest.error.message}`,
              })}\n`,
            );
            return;
          }

          onRequest({ request: parsedRequest.data })
            .then((response) => {
              socket.end(`${JSON.stringify(response)}\n`);
            })
            .catch((error: unknown) => {
              socket.end(`${JSON.stringify({ ok: false, payload: '', error: String(error) })}\n`);
            });
        } catch (error) {
          socket.end(
            `${JSON.stringify({
              ok: false,
              payload: '',
              error: `Malformed request frame: ${String(error)}`,
            })}\n`,
          );
        }
      });
    });

    server.on('error', (error: Error) => {
      reject(error);
    });

    server.listen(socketPath, () => {
      resolve({
        success: true as const,
        close: async (): Promise<void> =>
          new Promise((resolveClose) => {
            server.close(() => {
              resolveClose();
            });
          }),
      });
    });
  });
