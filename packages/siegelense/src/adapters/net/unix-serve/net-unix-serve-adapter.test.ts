import { netUnixServeAdapter } from './net-unix-serve-adapter';
import { netUnixServeAdapterProxy } from './net-unix-serve-adapter.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { DriverRequestStub } from '../../../contracts/driver-request/driver-request.stub';
import { DriverResponseStub } from '../../../contracts/driver-response/driver-response.stub';

type DriverRequest = ReturnType<typeof DriverRequestStub>;
type DriverResponse = ReturnType<typeof DriverResponseStub>;

describe('netUnixServeAdapter', () => {
  describe('binding the socket', () => {
    it('VALID: {socketPath: nothing there yet} => resolves success and a close function once listening', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();

      const result = await netUnixServeAdapter({
        socketPath,
        onRequest: async ({
          request: _request,
        }: {
          request: DriverRequest;
        }): Promise<DriverResponse> =>
          Promise.resolve(DriverResponseStub({ ok: true, payload: '', error: null })),
      });

      expect(result).toStrictEqual({ success: true, close: expect.any(Function) });
    });

    it('VALID: {socketPath: nothing there yet} => never unlinks anything', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();

      await netUnixServeAdapter({
        socketPath,
        onRequest: async ({
          request: _request,
        }: {
          request: DriverRequest;
        }): Promise<DriverResponse> =>
          Promise.resolve(DriverResponseStub({ ok: true, payload: '', error: null })),
      });

      expect(proxy.getUnlinkedPaths()).toStrictEqual([]);
    });

    it('VALID: {socketPath: parent directory absent} => creates it before checking for a stale file', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();

      await netUnixServeAdapter({
        socketPath,
        onRequest: async ({
          request: _request,
        }: {
          request: DriverRequest;
        }): Promise<DriverResponse> =>
          Promise.resolve(DriverResponseStub({ ok: true, payload: '', error: null })),
      });

      expect(proxy.getCreatedDirs()).toStrictEqual(['/tmp/dm-siege-sockets']);
    });

    it('VALID: {socketPath: a stale socket file sits there} => unlinks it before listening', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupStaleSocket({ socketPath });

      await netUnixServeAdapter({
        socketPath,
        onRequest: async ({
          request: _request,
        }: {
          request: DriverRequest;
        }): Promise<DriverResponse> =>
          Promise.resolve(DriverResponseStub({ ok: true, payload: '', error: null })),
      });

      expect(proxy.getUnlinkedPaths()).toStrictEqual([socketPath]);
    });

    it('VALID: {socketPath} => listens on the exact socket path passed in', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();

      await netUnixServeAdapter({
        socketPath,
        onRequest: async ({
          request: _request,
        }: {
          request: DriverRequest;
        }): Promise<DriverResponse> =>
          Promise.resolve(DriverResponseStub({ ok: true, payload: '', error: null })),
      });

      expect(proxy.getListenedPath()).toBe(socketPath);
    });
  });

  describe('the socket refuses to bind', () => {
    it('ERROR: {listen: EADDRINUSE} => rejects with that exact error', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      const listenError = Object.assign(new Error('listen EADDRINUSE'), {
        code: 'EADDRINUSE',
      });
      proxy.setupFreshSocket();
      proxy.listenFails({ error: listenError });

      await expect(
        netUnixServeAdapter({
          socketPath,
          onRequest: async ({
            request: _request,
          }: {
            request: DriverRequest;
          }): Promise<DriverResponse> =>
            Promise.resolve(DriverResponseStub({ ok: true, payload: '', error: null })),
        }),
      ).rejects.toBe(listenError);
    });
  });

  describe('a client sends a well-formed request', () => {
    it('VALID: {request frame} => calls onRequest with the parsed request', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();
      const response = DriverResponseStub({ ok: true, payload: '{"alive":true}', error: null });
      const receivedRequests: DriverRequest[] = [];

      await netUnixServeAdapter({
        socketPath,
        onRequest: async ({ request }: { request: DriverRequest }): Promise<DriverResponse> => {
          receivedRequests.push(request);
          return Promise.resolve(response);
        },
      });

      const client = proxy.connectClient();
      client.sendFrame({ frame: '{"kind":"ping","payload":""}\n' });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(receivedRequests).toStrictEqual([{ kind: 'ping', payload: '' }]);
    });

    it('VALID: {request frame} => the socket receives the JSON-encoded response, newline-terminated', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();
      const response = DriverResponseStub({ ok: true, payload: '{"alive":true}', error: null });

      await netUnixServeAdapter({
        socketPath,
        onRequest: async ({
          request: _request,
        }: {
          request: DriverRequest;
        }): Promise<DriverResponse> => Promise.resolve(response),
      });

      const client = proxy.connectClient();
      client.sendFrame({ frame: '{"kind":"ping","payload":""}\n' });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(client.getWrites()).toStrictEqual([
        '{"ok":true,"payload":"{\\"alive\\":true}","error":null}\n',
      ]);
    });
  });

  describe('onRequest rejects', () => {
    it('ERROR: {onRequest throws} => writes an ok:false frame carrying its message', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();

      await netUnixServeAdapter({
        socketPath,
        onRequest: async ({
          request: _request,
        }: {
          request: DriverRequest;
        }): Promise<DriverResponse> => Promise.reject(new Error('driver step exploded')),
      });

      const client = proxy.connectClient();
      client.sendFrame({ frame: '{"kind":"ping","payload":""}\n' });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(client.getWrites()).toStrictEqual([
        '{"ok":false,"payload":"","error":"Error: driver step exploded"}\n',
      ]);
    });
  });

  describe('a malformed request frame never reaches onRequest', () => {
    it('ERROR: {frame: invalid JSON} => onRequest is never called', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();
      const receivedRequests: DriverRequest[] = [];

      await netUnixServeAdapter({
        socketPath,
        onRequest: async ({ request }: { request: DriverRequest }): Promise<DriverResponse> => {
          receivedRequests.push(request);
          return Promise.resolve(DriverResponseStub({ ok: true, payload: '', error: null }));
        },
      });

      const client = proxy.connectClient();
      client.sendFrame({ frame: 'not-json\n' });

      expect(receivedRequests).toStrictEqual([]);
    });

    it('ERROR: {frame: invalid JSON} => writes an ok:false frame naming the malformed request', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();

      await netUnixServeAdapter({
        socketPath,
        onRequest: async ({
          request: _request,
        }: {
          request: DriverRequest;
        }): Promise<DriverResponse> =>
          Promise.resolve(DriverResponseStub({ ok: true, payload: '', error: null })),
      });

      const client = proxy.connectClient();
      client.sendFrame({ frame: 'not-json\n' });
      const [writtenFrame] = client.getWrites();

      expect(String(writtenFrame)).toMatch(
        /^\{"ok":false,"payload":"","error":"Malformed request frame: .+"\}\n$/u,
      );
    });

    it('ERROR: {frame: valid JSON missing kind} => writes an ok:false frame naming the malformed request', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();

      await netUnixServeAdapter({
        socketPath,
        onRequest: async ({
          request: _request,
        }: {
          request: DriverRequest;
        }): Promise<DriverResponse> =>
          Promise.resolve(DriverResponseStub({ ok: true, payload: '', error: null })),
      });

      const client = proxy.connectClient();
      client.sendFrame({ frame: '{"payload":""}\n' });
      const [writtenFrame] = client.getWrites();

      expect(String(writtenFrame)).toMatch(
        /^\{"ok":false,"payload":"","error":"Malformed request frame: .+"\}\n$/u,
      );
    });
  });

  describe('closing the server', () => {
    it('VALID: {close called} => stops the underlying net.Server exactly once', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();

      const { close } = await netUnixServeAdapter({
        socketPath,
        onRequest: async ({
          request: _request,
        }: {
          request: DriverRequest;
        }): Promise<DriverResponse> =>
          Promise.resolve(DriverResponseStub({ ok: true, payload: '', error: null })),
      });
      await close();

      expect(proxy.getCloseCallCount()).toBe(1);
    });

    it('VALID: {close called} => the returned promise resolves', async () => {
      const proxy = netUnixServeAdapterProxy();
      const socketPath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock',
      });
      proxy.setupFreshSocket();

      const { close } = await netUnixServeAdapter({
        socketPath,
        onRequest: async ({
          request: _request,
        }: {
          request: DriverRequest;
        }): Promise<DriverResponse> =>
          Promise.resolve(DriverResponseStub({ ok: true, payload: '', error: null })),
      });

      await expect(close()).resolves.toBe(undefined);
    });
  });
});
