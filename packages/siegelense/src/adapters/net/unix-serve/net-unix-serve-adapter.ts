/**
 * PURPOSE: Listens on a unix domain socket and dispatches each newline-terminated request frame to
 * `onRequest`, writing its resolved response back the same way — the server half of the
 * thin-client-over-a-socket design (siegelense-tooling.md line 1616). Unlinks a stale socket file
 * before binding, since a driver that was SIGKILLed leaves its socket file behind and a fresh
 * `listen()` against it fails EADDRINUSE. A request frame that fails
 * `driverRequestContract.safeParse` — malformed JSON, or valid JSON missing a required field — never
 * reaches `onRequest`; the caller on the other end of the socket gets a real `{ok:false,...}` frame
 * back instead of a connection that silently never answers.
 *
 * USAGE:
 * await netUnixServeAdapter({
 *   socketPath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock' }),
 *   onRequest: async ({ request }) => driverHandleRequestBroker({ request }),
 * });
 * // Resolves { success: true } once the socket is listening
 */

import { createServer } from 'net';
import { existsSync, unlinkSync } from 'fs';
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
}): Promise<AdapterResult> =>
  new Promise((resolve, reject) => {
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
            socket.write(
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
              socket.write(`${JSON.stringify(response)}\n`);
            })
            .catch((error: unknown) => {
              socket.write(`${JSON.stringify({ ok: false, payload: '', error: String(error) })}\n`);
            });
        } catch (error) {
          socket.write(
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
      resolve({ success: true as const });
    });
  });
