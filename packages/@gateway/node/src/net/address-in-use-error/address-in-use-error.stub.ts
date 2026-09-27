/**
 * PURPOSE: A real EADDRINUSE error, captured from an actual bind attempt rather than hand-built —
 * binds a real listener on an OS-assigned port and holds it open, then binds a second server to
 * that same port. The OS refuses the second bind for real, so the fields on the resulting error
 * always match whatever Node/OS is actually installed.
 *
 * USAGE:
 * const error = await AddressInUseErrorStub();
 * // Returns a real NodeJS.ErrnoException: { code: 'EADDRINUSE', syscall: 'listen', ... }
 */
import { createServer } from 'net';
import type { AddressInfo } from 'net';

export const AddressInUseErrorStub = async (): Promise<NodeJS.ErrnoException> => {
  const occupier = createServer();

  const port = await new Promise<number>((resolve) => {
    occupier.listen(0, () => {
      resolve((occupier.address() as AddressInfo).port);
    });
  });

  const error = await new Promise<NodeJS.ErrnoException>((resolve, reject) => {
    const challenger = createServer();

    challenger.once('error', (bindError: NodeJS.ErrnoException) => {
      resolve(bindError);
    });

    challenger.once('listening', () => {
      challenger.close();
      reject(new Error(`AddressInUseErrorStub: port ${port} was not actually in use`));
    });

    challenger.listen(port);
  });

  await new Promise<void>((resolve) => {
    occupier.close(() => {
      resolve();
    });
  });

  return error;
};
