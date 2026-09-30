/**
 * PURPOSE: Sends one `DriverRequest` frame down a driver's unix socket and parses the one line it
 * writes back into a `DriverResponse`. `unixSocketRequest` moves plain lines and knows no frame
 * shape; this broker is where the siegelense frame contract meets the socket, so every thin client
 * (`start`'s boot poll, `run`, `kill`, the driver live check) reads the same parse. Rejects with the
 * CONNECTION's own error (its `.code`, e.g. `ENOENT` when no socket file exists, `ECONNREFUSED` when
 * one exists but nothing listens) rather than translating it — only a path reaches here, so the
 * caller holding the registry row wraps it into `DriverUnreachableError`. A line that is not JSON,
 * or JSON that fails `driverResponseContract`, rejects naming the socket rather than throwing from
 * a field access, since everything off a socket is `unknown` until a contract says otherwise.
 *
 * USAGE:
 * await driverSocketRequestBroker({
 *   socketPath: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
 *   request: DriverRequestStub({ kind: 'ping', payload: '' }),
 *   timeoutMs: 5000,
 * });
 * // Returns the parsed DriverResponse the driver wrote back
 */

import { unixSocketRequest } from '#gateway/node/net';

import { driverResponseContract } from '../../../contracts/driver-response/driver-response-contract';
import type { DriverResponse } from '../../../contracts/driver-response/driver-response-contract';
import type { DriverRequest } from '../../../contracts/driver-request/driver-request-contract';

export const driverSocketRequestBroker = async ({
  socketPath,
  request,
  timeoutMs,
}: {
  socketPath: string;
  request: DriverRequest;
  timeoutMs: number;
}): Promise<DriverResponse> => {
  const line = await unixSocketRequest({
    socketPath,
    requestLine: JSON.stringify(request),
    timeoutMs,
  });

  const parsedResponse = ((): ReturnType<typeof driverResponseContract.safeParse> => {
    try {
      return driverResponseContract.safeParse(JSON.parse(line));
    } catch (error) {
      throw new Error(`Malformed frame from driver at ${socketPath}: ${String(error)}`, {
        cause: error,
      });
    }
  })();

  if (!parsedResponse.success) {
    throw new Error(
      `Malformed frame from driver at ${socketPath}: ${parsedResponse.error.message}`,
    );
  }

  return parsedResponse.data;
};
