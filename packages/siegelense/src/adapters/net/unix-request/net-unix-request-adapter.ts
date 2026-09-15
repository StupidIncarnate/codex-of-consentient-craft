/**
 * PURPOSE: Sends one request frame down a unix domain socket to a per-instance driver and reads one
 * response frame back — the whole client half of the thin-client-over-a-socket design
 * (siegelense-tooling.md line 1616), so an MCP tool rebuild-and-reconnect never touches the live
 * browser the driver holds. Rejects with the CONNECTION's own error (its `.code`, e.g. `ENOENT` when
 * no socket file exists, `ECONNREFUSED` when one exists but nothing is listening) rather than
 * translating it — this adapter has no `instanceId`, only a path, so it cannot itself construct
 * `DriverUnreachableError`; the caller, which already holds both from the registry row it read to
 * find this socket, does that wrapping. A frame that arrives malformed is rejected through
 * `driverResponseContract.safeParse` rather than thrown from a bare field access, since everything
 * off a socket is `unknown` until a contract says otherwise.
 *
 * USAGE:
 * await netUnixRequestAdapter({
 *   socketPath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock' }),
 *   request: DriverRequestStub({ kind: 'ping', payload: '' }),
 *   timeoutMs: 5000,
 * });
 * // Returns the parsed DriverResponse the driver wrote back
 */

import { createConnection } from 'net';
import { driverResponseContract } from '../../../contracts/driver-response/driver-response-contract';
import type { DriverResponse } from '../../../contracts/driver-response/driver-response-contract';
import type { DriverRequest } from '../../../contracts/driver-request/driver-request-contract';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const netUnixRequestAdapter = async ({
  socketPath,
  request,
  timeoutMs,
}: {
  socketPath: AbsoluteFilePath;
  request: DriverRequest;
  timeoutMs: number;
}): Promise<DriverResponse> =>
  new Promise((resolve, reject) => {
    const socket = createConnection({ path: socketPath });
    let buffer = '';

    const timer = setTimeout(() => {
      socket.removeAllListeners();
      socket.destroy();
      reject(new Error(`Socket request to ${socketPath} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.on('connect', () => {
      socket.write(`${JSON.stringify(request)}\n`);
    });

    socket.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex === -1) {
        return;
      }
      const line = buffer.slice(0, newlineIndex);

      try {
        const parsedUnknown: unknown = JSON.parse(line);
        const parsedResponse = driverResponseContract.safeParse(parsedUnknown);
        clearTimeout(timer);
        socket.removeAllListeners();
        socket.destroy();

        if (!parsedResponse.success) {
          reject(
            new Error(
              `Malformed frame from driver at ${socketPath}: ${parsedResponse.error.message}`,
            ),
          );
          return;
        }
        resolve(parsedResponse.data);
      } catch (error) {
        clearTimeout(timer);
        socket.removeAllListeners();
        socket.destroy();
        reject(new Error(`Malformed frame from driver at ${socketPath}: ${String(error)}`));
      }
    });

    socket.on('error', (error: Error) => {
      clearTimeout(timer);
      socket.removeAllListeners();
      socket.destroy();
      reject(error);
    });
  });
