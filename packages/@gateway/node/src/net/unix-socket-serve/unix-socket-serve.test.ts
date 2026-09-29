import { unixSocketServe } from './unix-socket-serve';
import { unixSocketServeProxy } from './unix-socket-serve.proxy';
import { UnixSocketRecordedErrorStub } from '../unix-socket-recorded-error/unix-socket-recorded-error.stub';

// The same server bound on a real unix socket and driven by a real `unixSocketRequest` client lives
// in `net.test.ts`, which composes no proxy and so leaves `net` and `fs` real for the whole file.
describe('unixSocketServe', () => {
  describe('binding', () => {
    it('VALID: {fresh socket path} => creates the parent directory and resolves once listening', async () => {
      const proxy = unixSocketServeProxy();
      proxy.listens({ socketPath: '/tmp/dm-sock/ok.sock' });

      const server = await unixSocketServe({
        socketPath: '/tmp/dm-sock/ok.sock',
        onRequestLine: async (line) => Promise.resolve(line),
      });

      expect({
        close: server.close,
        mkdirs: proxy.getMkdirCallsFor({ socketPath: '/tmp/dm-sock/ok.sock' }),
        unlinks: proxy.getUnlinkCallsFor({ socketPath: '/tmp/dm-sock/ok.sock' }),
      }).toStrictEqual({
        close: expect.any(Function),
        mkdirs: [['/tmp/dm-sock', { recursive: true }]],
        unlinks: [],
      });
    });

    it('VALID: {a stale socket file left by a dead peer} => unlinks it before binding', async () => {
      const proxy = unixSocketServeProxy();
      proxy.listensOverStaleSocket({ socketPath: '/tmp/dm-sock/stale.sock' });

      await unixSocketServe({
        socketPath: '/tmp/dm-sock/stale.sock',
        onRequestLine: async (line) => Promise.resolve(line),
      });

      expect(proxy.getUnlinkCallsFor({ socketPath: '/tmp/dm-sock/stale.sock' })).toStrictEqual([
        ['/tmp/dm-sock/stale.sock'],
      ]);
    });

    it('ERROR: {socket path already held} => rejects with the recorded EADDRINUSE', async () => {
      const proxy = unixSocketServeProxy();
      const error = UnixSocketRecordedErrorStub({
        code: 'EADDRINUSE',
        socketPath: '/tmp/dm-sock/held.sock',
      });
      proxy.listenFails({ socketPath: '/tmp/dm-sock/held.sock', error });

      await expect(
        unixSocketServe({
          socketPath: '/tmp/dm-sock/held.sock',
          onRequestLine: async (line) => Promise.resolve(line),
        }),
      ).rejects.toBe(error);
    });
  });

  describe('serving', () => {
    it('VALID: {onRequestLine resolving a value} => writes that value back to the client', async () => {
      const proxy = unixSocketServeProxy();
      proxy.listens({ socketPath: '/tmp/dm-sock/ok.sock' });
      await unixSocketServe({
        socketPath: '/tmp/dm-sock/ok.sock',
        onRequestLine: async (line) => Promise.resolve(`handled:${line}`),
      });
      const client = proxy.connectClient({ socketPath: '/tmp/dm-sock/ok.sock' });

      client.sendLine({ line: 'hello' });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(client.getWrittenLines()).toStrictEqual(['handled:hello']);
    });

    it('ERROR: {onRequestLine throws} => writes an ERROR frame back instead of hanging the client', async () => {
      const proxy = unixSocketServeProxy();
      proxy.listens({ socketPath: '/tmp/dm-sock/throws.sock' });
      await unixSocketServe({
        socketPath: '/tmp/dm-sock/throws.sock',
        onRequestLine: async () => Promise.reject(new Error('handler exploded')),
      });
      const client = proxy.connectClient({ socketPath: '/tmp/dm-sock/throws.sock' });

      client.sendLine({ line: 'x' });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(client.getWrittenLines()).toStrictEqual(['ERROR: handler exploded']);
    });
  });

  describe('closing', () => {
    it('VALID: {close} => closes the server bound on that path once', async () => {
      const proxy = unixSocketServeProxy();
      proxy.listens({ socketPath: '/tmp/dm-sock/ok.sock' });
      const server = await unixSocketServe({
        socketPath: '/tmp/dm-sock/ok.sock',
        onRequestLine: async (line) => Promise.resolve(line),
      });

      await server.close();

      expect(proxy.getCloseCountFor({ socketPath: '/tmp/dm-sock/ok.sock' })).toBe(1);
    });
  });
});
