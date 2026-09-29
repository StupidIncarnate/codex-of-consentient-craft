import { readdirEntriesSync } from './readdir-entries-sync';
import { readdirEntriesSyncProxy } from './readdir-entries-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';
import { DirentStub } from './dirent.stub';

describe('readdirEntriesSync', () => {
  it('VALID: {path: directory with mixed entry kinds} => returns each name paired with its kind', () => {
    const proxy = readdirEntriesSyncProxy();
    proxy.returns({
      path: '/repo/.dungeonmaster',
      entries: [
        { name: 'config.json', kind: 'file' },
        { name: 'quests', kind: 'directory' },
        { name: 'link', kind: 'symlink' },
      ],
    });

    expect(readdirEntriesSync('/repo/.dungeonmaster')).toStrictEqual([
      { name: 'config.json', kind: 'file' },
      { name: 'quests', kind: 'directory' },
      { name: 'link', kind: 'symlink' },
    ]);
  });

  it('EMPTY: {path: an empty directory} => returns an empty array', () => {
    const proxy = readdirEntriesSyncProxy();
    proxy.returns({ path: '/repo/.dungeonmaster', entries: [] });

    expect(readdirEntriesSync('/repo/.dungeonmaster')).toStrictEqual([]);
  });

  it('ERROR: {path: missing} => throws the raw ENOENT error', () => {
    const proxy = readdirEntriesSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/repo/missing' });
    proxy.throws({ path: '/repo/missing', error });

    expect(() => readdirEntriesSync('/repo/missing')).toThrow(error);
  });

  it('ERROR: {path: permission denied} => throws the raw EACCES error', () => {
    const proxy = readdirEntriesSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/repo/locked' });
    proxy.throws({ path: '/repo/locked', error });

    expect(() => readdirEntriesSync('/repo/locked')).toThrow(error);
  });

  it('ERROR: {path: a parent segment that is a file} => throws the raw ENOTDIR error', () => {
    const proxy = readdirEntriesSyncProxy();
    const error = FsErrorStub({ code: 'ENOTDIR', path: '/repo/.dungeonmaster.json/nested' });
    proxy.throws({ path: '/repo/.dungeonmaster.json/nested', error });

    expect(() => readdirEntriesSync('/repo/.dungeonmaster.json/nested')).toThrow(error);
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => returns entries for a path the predicate accepts', () => {
      const proxy = readdirEntriesSyncProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('.dungeonmaster'),
        entries: [{ name: 'config.json', kind: 'file' }],
      });

      expect(readdirEntriesSync('/resolved/at/runtime/.dungeonmaster')).toStrictEqual([
        { name: 'config.json', kind: 'file' },
      ]);
    });

    it('ERROR: {throwsMatchingPath, a predicate} => throws the staged error', () => {
      const proxy = readdirEntriesSyncProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing'),
        error,
      });

      expect(() => readdirEntriesSync('/resolved/at/runtime/missing')).toThrow(error);
    });
  });

  describe('implemented raw addressing', () => {
    it('VALID: {implementsRawMatchingPath, raw Dirents} => maps each raw entry through the real kind mapping', () => {
      const proxy = readdirEntriesSyncProxy();
      proxy.implementsRawMatchingPath({
        path: (value) => String(value).startsWith('/repo/'),
        fn: (path) => [
          DirentStub({ name: `${path.slice('/repo/'.length)}.ts`, kind: 'file', parentPath: path }),
          DirentStub({ name: 'nested', kind: 'directory', parentPath: path }),
          DirentStub({ name: 'link', kind: 'symlink', parentPath: path }),
          DirentStub({ name: 'socket', kind: 'other', parentPath: path }),
        ],
      });

      expect(readdirEntriesSync('/repo/src')).toStrictEqual([
        { name: 'src.ts', kind: 'file' },
        { name: 'nested', kind: 'directory' },
        { name: 'link', kind: 'symlink' },
        { name: 'socket', kind: 'other' },
      ]);
    });

    it('VALID: {implementsRawMatchingPath and returns for one path} => the exact stage wins for its path', () => {
      const proxy = readdirEntriesSyncProxy();
      proxy.returns({ path: '/repo/exact', entries: [{ name: 'staged.ts', kind: 'file' }] });
      proxy.implementsRawMatchingPath({
        path: (value) => String(value).startsWith('/repo/'),
        fn: (path) => [DirentStub({ name: 'from-fn.ts', kind: 'file', parentPath: path })],
      });

      expect([readdirEntriesSync('/repo/exact'), readdirEntriesSync('/repo/other')]).toStrictEqual([
        [{ name: 'staged.ts', kind: 'file' }],
        [{ name: 'from-fn.ts', kind: 'file' }],
      ]);
    });

    it('ERROR: {implementsRawMatchingPath, fn throws a missing-directory error} => throws that error', () => {
      const proxy = readdirEntriesSyncProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/repo/missing' });
      proxy.implementsRawMatchingPath({
        path: (value) => String(value).startsWith('/repo/'),
        fn: (): never => {
          throw error;
        },
      });

      expect(() => readdirEntriesSync('/repo/missing')).toThrow(error);
    });

    it('VALID: {implementsRawMatchingPath answered a read} => getCallsFor reads back the full call', () => {
      const proxy = readdirEntriesSyncProxy();
      proxy.implementsRawMatchingPath({
        path: (value) => String(value).startsWith('/repo/'),
        fn: () => [],
      });

      readdirEntriesSync('/repo/src');

      expect(proxy.getCallsFor({ path: '/repo/src' })).toStrictEqual([
        ['/repo/src', { withFileTypes: true }],
      ]);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', () => {
      const proxy = readdirEntriesSyncProxy();
      proxy.returns({ path: '/repo/.dungeonmaster', entries: [] });

      readdirEntriesSync('/repo/.dungeonmaster');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster' })).toStrictEqual([
        ['/repo/.dungeonmaster', { withFileTypes: true }],
      ]);
    });
  });
});
