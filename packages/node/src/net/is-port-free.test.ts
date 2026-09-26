import { createServer, type AddressInfo } from 'net';
import { isPortFree } from './is-port-free';

describe('isPortFree', () => {
  it('VALID: {port: an OS-assigned free port} => resolves true', async () => {
    const probe = createServer();
    await new Promise<void>((resolve) => {
      probe.listen(0, resolve);
    });
    // listen(0) with no path always yields an AddressInfo, never the string/null shapes the
    // return type also allows.
    const { port } = probe.address() as AddressInfo;
    await new Promise<void>((resolve) => {
      probe.close(() => {
        resolve();
      });
    });

    const result = await isPortFree({ port });

    expect(result).toBe(true);
  });

  it('ERROR: {port: already bound by another server} => resolves false on EADDRINUSE', async () => {
    const occupier = createServer();
    await new Promise<void>((resolve) => {
      occupier.listen(0, resolve);
    });
    const { port } = occupier.address() as AddressInfo;

    const result = await isPortFree({ port });

    await new Promise<void>((resolve) => {
      occupier.close(() => {
        resolve();
      });
    });

    expect(result).toBe(false);
  });
});
