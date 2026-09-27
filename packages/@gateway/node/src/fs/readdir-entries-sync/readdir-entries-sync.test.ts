import { readdirEntriesSync } from './readdir-entries-sync';
import { readdirEntriesSyncProxy } from './readdir-entries-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

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
