import { statSync } from './stat-sync';
import { statSyncProxy } from './stat-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('statSync', () => {
  it('VALID: {path: a regular file} => returns kind file with size and mtime', () => {
    const proxy = statSyncProxy();
    proxy.returns({
      path: '/tmp/config.json',
      kind: 'file',
      sizeBytes: 42,
      modifiedAtMs: 1700000000000,
    });

    expect(statSync('/tmp/config.json')).toStrictEqual({
      kind: 'file',
      sizeBytes: 42,
      modifiedAtMs: 1700000000000,
    });
  });

  it('VALID: {path: a directory} => returns kind directory', () => {
    const proxy = statSyncProxy();
    proxy.returns({ path: '/tmp/adir', kind: 'directory', sizeBytes: 4096, modifiedAtMs: 1 });

    expect(statSync('/tmp/adir')).toStrictEqual({
      kind: 'directory',
      sizeBytes: 4096,
      modifiedAtMs: 1,
    });
  });

  it('EDGE: {path: neither a file, directory, nor symlink} => returns kind other', () => {
    const proxy = statSyncProxy();
    proxy.returns({ path: '/dev/null', kind: 'other', sizeBytes: 0, modifiedAtMs: 0 });

    expect(statSync('/dev/null')).toStrictEqual({ kind: 'other', sizeBytes: 0, modifiedAtMs: 0 });
  });

  it('ERROR: {path: a missing path, ENOENT} => throws the raw error', () => {
    const proxy = statSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/tmp/missing' });
    proxy.throws({ path: '/tmp/missing', error });

    expect(() => statSync('/tmp/missing')).toThrow(error);
  });

  it('ERROR: {path: an unreadable path, EACCES} => throws the raw error', () => {
    const proxy = statSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/tmp/locked' });
    proxy.throws({ path: '/tmp/locked', error });

    expect(() => statSync('/tmp/locked')).toThrow(error);
  });
});
