import { unixSocketRequest } from './unix-socket-request';
import { unixSocketRequestProxy } from './unix-socket-request.proxy';
import { UnixSocketRecordedErrorStub } from '../unix-socket-recorded-error/unix-socket-recorded-error.stub';

// The same round trip against a real unix socket and a real `unixSocketServe` peer lives in
// `net.test.ts`, which composes no proxy and so leaves `net` real for the whole file.
describe('unixSocketRequest', () => {
  describe('a peer that answers', () => {
    it('VALID: {respondsWith} => resolves the line the peer wrote back', async () => {
      const proxy = unixSocketRequestProxy();
      proxy.respondsWith({ socketPath: '/tmp/dm-sock/echo.sock', line: 'echo:ping' });

      const response = await unixSocketRequest({
        socketPath: '/tmp/dm-sock/echo.sock',
        requestLine: 'ping',
        timeoutMs: 2000,
      });

      expect(response).toBe('echo:ping');
    });

    it('VALID: {two requests to one socket} => getRequestLinesFor reads back each line in order', async () => {
      const proxy = unixSocketRequestProxy();
      proxy.respondsWith({ socketPath: '/tmp/dm-sock/echo.sock', line: '{"ok":true}' });

      await unixSocketRequest({
        socketPath: '/tmp/dm-sock/echo.sock',
        requestLine: '{"kind":"ping"}',
        timeoutMs: 2000,
      });
      await unixSocketRequest({
        socketPath: '/tmp/dm-sock/echo.sock',
        requestLine: '{"kind":"kill"}',
        timeoutMs: 2000,
      });

      expect(proxy.getRequestLinesFor({ socketPath: '/tmp/dm-sock/echo.sock' })).toStrictEqual([
        '{"kind":"ping"}',
        '{"kind":"kill"}',
      ]);
    });

    it('VALID: {two sockets staged apart} => each socket answers its own line', async () => {
      const proxy = unixSocketRequestProxy();
      proxy.respondsWith({ socketPath: '/tmp/dm-sock/a.sock', line: 'from-a' });
      proxy.respondsWith({ socketPath: '/tmp/dm-sock/b.sock', line: 'from-b' });

      const b = await unixSocketRequest({
        socketPath: '/tmp/dm-sock/b.sock',
        requestLine: 'ping',
        timeoutMs: 2000,
      });

      expect(b).toBe('from-b');
      expect(proxy.getRequestLinesFor({ socketPath: '/tmp/dm-sock/a.sock' })).toStrictEqual([]);
    });
  });

  describe('a peer that cannot be reached', () => {
    it('ERROR: {socket file never existed} => rejects with the recorded ENOENT', async () => {
      const proxy = unixSocketRequestProxy();
      const error = UnixSocketRecordedErrorStub({
        code: 'ENOENT',
        socketPath: '/tmp/dm-sock/missing.sock',
      });
      proxy.rejects({ socketPath: '/tmp/dm-sock/missing.sock', error });

      await expect(
        unixSocketRequest({
          socketPath: '/tmp/dm-sock/missing.sock',
          requestLine: 'ping',
          timeoutMs: 2000,
        }),
      ).rejects.toBe(error);
    });

    it('ERROR: {socket file exists but nothing listens} => rejects with the recorded ECONNREFUSED and writes nothing', async () => {
      const proxy = unixSocketRequestProxy();
      const error = UnixSocketRecordedErrorStub({
        code: 'ECONNREFUSED',
        socketPath: '/tmp/dm-sock/stale.sock',
      });
      proxy.rejects({ socketPath: '/tmp/dm-sock/stale.sock', error });

      const caught: unknown = await unixSocketRequest({
        socketPath: '/tmp/dm-sock/stale.sock',
        requestLine: 'ping',
        timeoutMs: 2000,
      }).catch((rejection: unknown) => rejection);

      expect({
        caught,
        lines: proxy.getRequestLinesFor({ socketPath: '/tmp/dm-sock/stale.sock' }),
        connections: proxy.getConnectionCountFor({ socketPath: '/tmp/dm-sock/stale.sock' }),
      }).toStrictEqual({ caught: error, lines: [], connections: 1 });
    });

    it('ERROR: {peer never answers} => rejects with a timeout message after timeoutMs', async () => {
      const proxy = unixSocketRequestProxy();
      proxy.neverResponds({ socketPath: '/tmp/dm-sock/silent.sock' });

      await expect(
        unixSocketRequest({
          socketPath: '/tmp/dm-sock/silent.sock',
          requestLine: 'ping',
          timeoutMs: 50,
        }),
      ).rejects.toThrow(/^Socket request to \/tmp\/dm-sock\/silent\.sock timed out after 50ms$/u);
      expect(proxy.getRequestLinesFor({ socketPath: '/tmp/dm-sock/silent.sock' })).toStrictEqual([
        'ping',
      ]);
    });
  });
});
