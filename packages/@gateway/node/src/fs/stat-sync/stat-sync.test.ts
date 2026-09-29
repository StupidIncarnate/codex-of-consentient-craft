import { statSync } from './stat-sync';
import { statSyncProxy } from './stat-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('statSync', () => {
  it('VALID: {path: a regular file} => returns kind file with size, mtime and inode', () => {
    const proxy = statSyncProxy();
    proxy.returns({
      path: '/tmp/config.json',
      kind: 'file',
      sizeBytes: 42,
      modifiedAtMs: 1700000000000,
      inode: 1234567,
    });

    expect(statSync('/tmp/config.json')).toStrictEqual({
      kind: 'file',
      sizeBytes: 42,
      modifiedAtMs: 1700000000000,
      inode: 1234567,
    });
  });

  it('VALID: {two paths with distinct inodes} => returns each path its own inode', () => {
    const proxy = statSyncProxy();
    proxy.returns({
      path: '/tmp/images/a.png',
      kind: 'file',
      sizeBytes: 10,
      modifiedAtMs: 1,
      inode: 111,
    });
    proxy.returns({
      path: '/tmp/images/b.png',
      kind: 'file',
      sizeBytes: 10,
      modifiedAtMs: 1,
      inode: 222,
    });

    expect([
      statSync('/tmp/images/a.png').inode,
      statSync('/tmp/images/b.png').inode,
    ]).toStrictEqual([111, 222]);
  });

  it('VALID: {path: a directory} => returns kind directory', () => {
    const proxy = statSyncProxy();
    proxy.returns({ path: '/tmp/adir', kind: 'directory', sizeBytes: 4096, modifiedAtMs: 1 });

    expect(statSync('/tmp/adir')).toStrictEqual({
      kind: 'directory',
      sizeBytes: 4096,
      modifiedAtMs: 1,
      inode: 0,
    });
  });

  it('EDGE: {path: neither a file, directory, nor symlink} => returns kind other', () => {
    const proxy = statSyncProxy();
    proxy.returns({ path: '/dev/null', kind: 'other', sizeBytes: 0, modifiedAtMs: 0 });

    expect(statSync('/dev/null')).toStrictEqual({
      kind: 'other',
      sizeBytes: 0,
      modifiedAtMs: 0,
      inode: 0,
    });
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

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => returns stats for a path the predicate accepts', () => {
      const proxy = statSyncProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('config.json'),
        kind: 'file',
        sizeBytes: 42,
        modifiedAtMs: 1700000000000,
        inode: 98765,
      });

      expect(statSync('/resolved/at/runtime/config.json')).toStrictEqual({
        kind: 'file',
        sizeBytes: 42,
        modifiedAtMs: 1700000000000,
        inode: 98765,
      });
    });

    it('ERROR: {throwsMatchingPath, a predicate} => throws the staged error', () => {
      const proxy = statSyncProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing'),
        error,
      });

      expect(() => statSync('/resolved/at/runtime/missing')).toThrow(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', () => {
      const proxy = statSyncProxy();
      proxy.returns({
        path: '/tmp/config.json',
        kind: 'file',
        sizeBytes: 42,
        modifiedAtMs: 1700000000000,
      });

      statSync('/tmp/config.json');

      expect(proxy.getCallsFor({ path: '/tmp/config.json' })).toStrictEqual([['/tmp/config.json']]);
    });
  });
});
