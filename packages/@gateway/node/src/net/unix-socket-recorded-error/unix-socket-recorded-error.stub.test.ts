import { join } from 'path';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { createServer } from 'net';
import { tmpdir } from '../../os/os';
import { unixSocketRequest } from '../unix-socket-request/unix-socket-request';
import { UnixSocketRecordedErrorStub } from './unix-socket-recorded-error.stub';

describe('UnixSocketRecordedErrorStub', () => {
  it('VALID: {code: ENOENT} => matches a real request to a socket file that never existed', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
    const socketPath = join(dir, 'missing.sock');

    const caught: unknown = await unixSocketRequest({
      socketPath,
      requestLine: 'ping',
      timeoutMs: 2000,
    }).catch((error: unknown) => error);
    const real = caught as NodeJS.ErrnoException;
    rmSync(dir, { recursive: true, force: true });
    const recorded = UnixSocketRecordedErrorStub({ code: 'ENOENT', socketPath });

    expect({ ...recorded, message: recorded.message }).toStrictEqual({
      ...real,
      message: real.message,
    });
  });

  it('VALID: {code: ECONNREFUSED} => matches a real request to a socket file nothing listens on', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
    const socketPath = join(dir, 'stale.sock');
    writeFileSync(socketPath, '');

    const caught: unknown = await unixSocketRequest({
      socketPath,
      requestLine: 'ping',
      timeoutMs: 2000,
    }).catch((error: unknown) => error);
    const real = caught as NodeJS.ErrnoException;
    rmSync(dir, { recursive: true, force: true });
    const recorded = UnixSocketRecordedErrorStub({ code: 'ECONNREFUSED', socketPath });

    expect({ ...recorded, message: recorded.message }).toStrictEqual({
      ...real,
      message: real.message,
    });
  });

  it('VALID: {code: EADDRINUSE} => matches a real second listen on a held socket path', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-net-'));
    const socketPath = join(dir, 'held.sock');
    const holder = createServer();
    await new Promise<void>((resolve) => {
      holder.listen(socketPath, resolve);
    });

    const real = await new Promise<NodeJS.ErrnoException>((resolve) => {
      const challenger = createServer();
      challenger.once('error', resolve);
      challenger.listen(socketPath);
    });
    await new Promise<void>((resolve) => {
      holder.close(() => {
        resolve();
      });
    });
    rmSync(dir, { recursive: true, force: true });
    const recorded = UnixSocketRecordedErrorStub({ code: 'EADDRINUSE', socketPath });

    expect({ ...recorded, message: recorded.message }).toStrictEqual({
      ...real,
      message: real.message,
    });
  });
});
