import { join } from 'path';
import { chmodSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from '../os/os';
import { isPortFree, freePortPair, unixSocketRequest, unixSocketServe } from './net';

// This file composes no proxy, so `net` and `fs` stay real: the unix-socket pair is proven here
// against real sockets in a real tmpdir, where each wrapper's own test stages the other side.
describe('#gateway/node/net', () => {
  it('VALID: {barrel} => re-exports every curated net function', () => {
    expect(isPortFree).toStrictEqual(expect.any(Function));
    expect(freePortPair).toStrictEqual(expect.any(Function));
    expect(unixSocketRequest).toStrictEqual(expect.any(Function));
    expect(unixSocketServe).toStrictEqual(expect.any(Function));
  });

  describe('unixSocketServe and unixSocketRequest over a real socket', () => {
    it('VALID: {a server answering the request line} => the client resolves the line written back', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
      const socketPath = join(dir, 'nested', 'echo.sock');
      const server = await unixSocketServe({
        socketPath,
        onRequestLine: async (line) => Promise.resolve(`echo:${line}`),
      });

      const response = await unixSocketRequest({
        socketPath,
        requestLine: 'ping',
        timeoutMs: 2000,
      });

      await server.close();
      rmSync(dir, { recursive: true, force: true });

      expect(response).toBe('echo:ping');
    });

    it('VALID: {a stale socket file left by a dead peer} => the second server unlinks it and rebinds', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
      const socketPath = join(dir, 'stale.sock');
      const firstServer = await unixSocketServe({
        socketPath,
        onRequestLine: async (line) => Promise.resolve(line),
      });

      const secondServer = await unixSocketServe({
        socketPath,
        onRequestLine: async (line) => Promise.resolve(`second:${line}`),
      });
      const response = await unixSocketRequest({ socketPath, requestLine: 'x', timeoutMs: 2000 });

      await firstServer.close();
      await secondServer.close();
      rmSync(dir, { recursive: true, force: true });

      expect(response).toBe('second:x');
    });

    it('ERROR: {onRequestLine throws} => the client reads an ERROR frame', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
      const socketPath = join(dir, 'throws.sock');
      const server = await unixSocketServe({
        socketPath,
        onRequestLine: async () => Promise.reject(new Error('handler exploded')),
      });

      const response = await unixSocketRequest({ socketPath, requestLine: 'x', timeoutMs: 2000 });

      await server.close();
      rmSync(dir, { recursive: true, force: true });

      expect(response).toBe('ERROR: handler exploded');
    });

    it('ERROR: {peer never answers} => the client rejects with a timeout message after timeoutMs', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
      const socketPath = join(dir, 'silent.sock');
      const server = await unixSocketServe({
        socketPath,
        onRequestLine: async () =>
          new Promise<string>(() => {
            // Deliberately never settles.
          }),
      });

      const caught: unknown = await unixSocketRequest({
        socketPath,
        requestLine: 'ping',
        timeoutMs: 50,
      }).catch((error: unknown) => error);
      const error = caught as Error;

      await server.close();
      rmSync(dir, { recursive: true, force: true });

      expect(error.message).toBe(`Socket request to ${socketPath} timed out after 50ms`);
    });

    it('ERROR: {socket path parent is not writable} => the server rejects with code EACCES', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
      chmodSync(dir, 0o500);
      const socketPath = join(dir, 'denied.sock');

      const caught: unknown = await unixSocketServe({
        socketPath,
        onRequestLine: async (line) => Promise.resolve(line),
      }).catch((error: unknown) => error);
      const error = caught as NodeJS.ErrnoException;

      chmodSync(dir, 0o700);
      rmSync(dir, { recursive: true, force: true });

      expect(error.code).toBe('EACCES');
    });
  });
});
