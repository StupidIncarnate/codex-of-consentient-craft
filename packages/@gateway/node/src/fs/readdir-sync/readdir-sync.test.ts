import { readdirSync } from './readdir-sync';
import { readdirSyncProxy } from './readdir-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('readdirSync', () => {
  it('VALID: {path: a directory with entries} => returns the entry names', () => {
    const proxy = readdirSyncProxy();
    proxy.returns({ path: '/tmp/adir', names: ['a.txt', 'b.txt'] });

    expect(readdirSync('/tmp/adir')).toStrictEqual(['a.txt', 'b.txt']);
  });

  it('EMPTY: {path: an empty directory} => returns an empty array', () => {
    const proxy = readdirSyncProxy();
    proxy.returns({ path: '/tmp/emptydir', names: [] });

    expect(readdirSync('/tmp/emptydir')).toStrictEqual([]);
  });

  it('ERROR: {path: a missing directory, ENOENT} => throws the raw error', () => {
    const proxy = readdirSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/tmp/missing' });
    proxy.throws({ path: '/tmp/missing', error });

    expect(() => readdirSync('/tmp/missing')).toThrow(error);
  });

  it('ERROR: {path: an unreadable directory, EACCES} => throws the raw error', () => {
    const proxy = readdirSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/tmp/locked' });
    proxy.throws({ path: '/tmp/locked', error });

    expect(() => readdirSync('/tmp/locked')).toThrow(error);
  });

  it('ERROR: {path: a path through a non-directory segment, ENOTDIR} => throws the raw error', () => {
    const proxy = readdirSyncProxy();
    const error = FsErrorStub({ code: 'ENOTDIR', path: '/tmp/afile/child' });
    proxy.throws({ path: '/tmp/afile/child', error });

    expect(() => readdirSync('/tmp/afile/child')).toThrow(error);
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => returns names for a path the predicate accepts', () => {
      const proxy = readdirSyncProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('adir'),
        names: ['a.txt', 'b.txt'],
      });

      expect(readdirSync('/resolved/at/runtime/adir')).toStrictEqual(['a.txt', 'b.txt']);
    });

    it('ERROR: {throwsMatchingPath, a predicate} => throws the staged error', () => {
      const proxy = readdirSyncProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing'),
        error,
      });

      expect(() => readdirSync('/resolved/at/runtime/missing')).toThrow(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', () => {
      const proxy = readdirSyncProxy();
      proxy.returns({ path: '/tmp/adir', names: ['a.txt'] });

      readdirSync('/tmp/adir');

      expect(proxy.getCallsFor({ path: '/tmp/adir' })).toStrictEqual([['/tmp/adir']]);
    });
  });
});
