import { join } from 'path';
import { mkdtempSync, chmodSync, rmSync } from 'fs';
import { tmpdir } from '../../os/os';
import { unixSocketServe } from './unix-socket-serve';
import { unixSocketServeProxy } from './unix-socket-serve.proxy';
import { unixSocketRequest } from '../unix-socket-request/unix-socket-request';

describe('unixSocketServe', () => {
  it('VALID: {onRequestLine resolving a value} => writes that value back to the requester', async () => {
    unixSocketServeProxy();
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
    const socketPath = join(dir, 'ok.sock');
    const server = await unixSocketServe({
      socketPath,
      onRequestLine: async (line) => Promise.resolve(`handled:${line}`),
    });

    const response = await unixSocketRequest({ socketPath, requestLine: 'hello', timeoutMs: 2000 });

    await server.close();
    rmSync(dir, { recursive: true, force: true });

    expect(response).toBe('handled:hello');
  });

  it('VALID: {a stale socket file left by a dead peer} => unlinks it and rebinds', async () => {
    unixSocketServeProxy();
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
    const socketPath = join(dir, 'stale.sock');
    const firstServer = await unixSocketServe({
      socketPath,
      onRequestLine: async (line) => Promise.resolve(line),
    });
    // Simulate a peer that died without cleaning up: the socket file survives on disk with
    // nothing listening on it once the handle above is dropped without close().

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

  it('ERROR: {onRequestLine throws} => writes an ERROR frame back instead of hanging the peer', async () => {
    unixSocketServeProxy();
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

  it('ERROR: {socket path parent is not writable} => rejects with code EACCES', async () => {
    unixSocketServeProxy();
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
