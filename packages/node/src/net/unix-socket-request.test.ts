import { join } from 'path';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from '../os';
import { unixSocketRequest } from './unix-socket-request';
import { unixSocketServe } from './unix-socket-serve';
import { unixSocketRequestProxy } from './unix-socket-request.proxy';

describe('unixSocketRequest', () => {
  it('VALID: {a server echoing the request line} => resolves the line the peer wrote back', async () => {
    unixSocketRequestProxy();
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
    const socketPath = join(dir, 'echo.sock');
    const server = await unixSocketServe({
      socketPath,
      onRequestLine: async (line) => Promise.resolve(`echo:${line}`),
    });

    const response = await unixSocketRequest({ socketPath, requestLine: 'ping', timeoutMs: 2000 });

    await server.close();
    rmSync(dir, { recursive: true, force: true });

    expect(response).toBe('echo:ping');
  });

  it('ERROR: {socketPath has never existed} => rejects with the connection error, code ENOENT', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
    const socketPath = join(dir, 'missing.sock');

    const caught: unknown = await unixSocketRequest({
      socketPath,
      requestLine: 'ping',
      timeoutMs: 2000,
    }).catch((error: unknown) => error);
    const error = caught as NodeJS.ErrnoException;

    rmSync(dir, { recursive: true, force: true });

    expect(error.code).toBe('ENOENT');
  });

  it('ERROR: {socketPath exists but nothing is listening} => rejects with code ECONNREFUSED', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
    const socketPath = join(dir, 'stale.sock');
    writeFileSync(socketPath, '');

    const caught: unknown = await unixSocketRequest({
      socketPath,
      requestLine: 'ping',
      timeoutMs: 2000,
    }).catch((error: unknown) => error);
    const error = caught as NodeJS.ErrnoException;

    rmSync(dir, { recursive: true, force: true });

    expect(error.code).toBe('ECONNREFUSED');
  });

  it('ERROR: {peer never answers} => rejects with a timeout message after timeoutMs', async () => {
    unixSocketRequestProxy();
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
    const socketPath = join(dir, 'silent.sock');
    const server = await unixSocketServe({
      socketPath,
      // Never resolves within the request's own timeout window.
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

    expect(error.message).toMatch(/^Socket request to .* timed out after 50ms$/u);
  });
});
