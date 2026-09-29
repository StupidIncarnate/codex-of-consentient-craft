import { readFileSync } from './read-file-sync';
import { readFileSyncProxy } from './read-file-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('readFileSync', () => {
  it('VALID: {path: a file with contents} => returns the contents as a string', () => {
    const proxy = readFileSyncProxy();
    proxy.returns({ path: '/tmp/config.json', contents: '{"a":1}' });

    expect(readFileSync('/tmp/config.json')).toBe('{"a":1}');
  });

  it('EDGE: {path: an empty file} => returns an empty string', () => {
    const proxy = readFileSyncProxy();
    proxy.returns({ path: '/tmp/empty.txt', contents: '' });

    expect(readFileSync('/tmp/empty.txt')).toBe('');
  });

  it('ERROR: {path: a missing file, ENOENT} => throws the raw error', () => {
    const proxy = readFileSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/tmp/missing.json' });
    proxy.throws({ path: '/tmp/missing.json', error });

    expect(() => readFileSync('/tmp/missing.json')).toThrow(error);
  });

  it('ERROR: {path: an unreadable file, EACCES} => throws the raw error', () => {
    const proxy = readFileSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/tmp/locked.json' });
    proxy.throws({ path: '/tmp/locked.json', error });

    expect(() => readFileSync('/tmp/locked.json')).toThrow(error);
  });

  it('ERROR: {path: a directory, EISDIR} => throws the raw error', () => {
    const proxy = readFileSyncProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/tmp/a-dir' });
    proxy.throws({ path: '/tmp/a-dir', error });

    expect(() => readFileSync('/tmp/a-dir')).toThrow(error);
  });

  it('ERROR: {path: a path through a non-directory segment, ENOTDIR} => throws the raw error', () => {
    const proxy = readFileSyncProxy();
    const error = FsErrorStub({ code: 'ENOTDIR', path: '/tmp/a-file/child' });
    proxy.throws({ path: '/tmp/a-file/child', error });

    expect(() => readFileSync('/tmp/a-file/child')).toThrow(error);
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => returns contents for a path the predicate accepts', () => {
      const proxy = readFileSyncProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('quest.json'),
        contents: '{"port":3737}',
      });

      expect(readFileSync('/resolved/at/runtime/quest.json')).toBe('{"port":3737}');
    });

    it('ERROR: {throwsMatchingPath, a predicate} => throws the staged error', () => {
      const proxy = readFileSyncProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing.json' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing.json'),
        error,
      });

      expect(() => readFileSync('/resolved/at/runtime/missing.json')).toThrow(error);
    });
  });

  describe('implemented addressing', () => {
    it('VALID: {implementsMatchingPath, two matching paths} => answers each path from the one function', () => {
      const proxy = readFileSyncProxy();
      proxy.implementsMatchingPath({
        path: (value) => String(value).startsWith('/repo/src/'),
        fn: (path) => `contents of ${path}`,
      });

      expect([readFileSync('/repo/src/a.ts'), readFileSync('/repo/src/b.ts')]).toStrictEqual([
        'contents of /repo/src/a.ts',
        'contents of /repo/src/b.ts',
      ]);
    });

    it('VALID: {implementsMatchingPath and returns for one path} => the exact stage wins for its path', () => {
      const proxy = readFileSyncProxy();
      proxy.returns({ path: '/repo/src/a.ts', contents: 'exact' });
      proxy.implementsMatchingPath({
        path: (value) => String(value).startsWith('/repo/src/'),
        fn: (path) => `contents of ${path}`,
      });

      expect([readFileSync('/repo/src/a.ts'), readFileSync('/repo/src/b.ts')]).toStrictEqual([
        'exact',
        'contents of /repo/src/b.ts',
      ]);
    });

    it('ERROR: {implementsMatchingPath, fn throws a missing-file error} => throws that error', () => {
      const proxy = readFileSyncProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/repo/src/missing.ts' });
      proxy.implementsMatchingPath({
        path: (value) => String(value).startsWith('/repo/src/'),
        fn: (): never => {
          throw error;
        },
      });

      expect(() => readFileSync('/repo/src/missing.ts')).toThrow(error);
    });

    it('VALID: {implementsMatchingPath answered a read} => getCallsFor reads back the full call', () => {
      const proxy = readFileSyncProxy();
      proxy.implementsMatchingPath({
        path: (value) => String(value).startsWith('/repo/src/'),
        fn: (path) => `contents of ${path}`,
      });

      readFileSync('/repo/src/a.ts');

      expect(proxy.getCallsFor({ path: '/repo/src/a.ts' })).toStrictEqual([
        ['/repo/src/a.ts', 'utf8'],
      ]);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', () => {
      const proxy = readFileSyncProxy();
      proxy.returns({ path: '/tmp/config.json', contents: '{"a":1}' });

      readFileSync('/tmp/config.json');

      expect(proxy.getCallsFor({ path: '/tmp/config.json' })).toStrictEqual([
        ['/tmp/config.json', 'utf8'],
      ]);
    });
  });
});
