/**
 * PURPOSE: A real ECONNREFUSED error, captured from an actual refused TCP connection rather than
 * hand-built — binds an ephemeral port, closes it immediately, then connects to that same (now
 * free) port. Nothing is listening there, so the OS refuses the connection for real, and the
 * fields on the resulting error always match whatever Node/OS is actually installed.
 *
 * USAGE:
 * const error = await ConnectionRefusedErrorStub();
 * // Returns a real NodeJS.ErrnoException: { code: 'ECONNREFUSED', syscall: 'connect', ... }
 */
import { createConnection, createServer } from 'net';
import type { AddressInfo } from 'net';

export const ConnectionRefusedErrorStub = async (): Promise<NodeJS.ErrnoException> => {
  const probe = createServer();

  const port = await new Promise<number>((resolve) => {
    probe.listen(0, () => {
      resolve((probe.address() as AddressInfo).port);
    });
  });

  await new Promise<void>((resolve) => {
    probe.close(() => {
      resolve();
    });
  });

  return new Promise((resolve, reject) => {
    const socket = createConnection({ port, host: '127.0.0.1' });

    socket.once('error', (error: NodeJS.ErrnoException) => {
      resolve(error);
    });

    socket.once('connect', () => {
      socket.destroy();
      reject(new Error(`ConnectionRefusedErrorStub: something is listening on port ${port}`));
    });
  });
};
