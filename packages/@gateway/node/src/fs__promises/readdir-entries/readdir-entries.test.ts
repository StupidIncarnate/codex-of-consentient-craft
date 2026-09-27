import { readdirEntries } from './readdir-entries';
import { readdirEntriesProxy } from './readdir-entries.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readdirEntries', () => {
  describe('successful reads', () => {
    it('VALID: {path: directory with mixed entry kinds} => returns each name paired with its kind', async () => {
      const proxy = readdirEntriesProxy();
      proxy.returns({
        path: '/repo/.dungeonmaster',
        entries: [
          { name: 'config.json', kind: 'file' },
          { name: 'quests', kind: 'directory' },
          { name: 'link', kind: 'symlink' },
        ],
      });

      const result = await readdirEntries('/repo/.dungeonmaster');

      expect(result).toStrictEqual([
        { name: 'config.json', kind: 'file' },
        { name: 'quests', kind: 'directory' },
        { name: 'link', kind: 'symlink' },
      ]);
    });
  });

  describe('empty directory', () => {
    it('EMPTY: {path: an empty directory} => returns an empty array', async () => {
      const proxy = readdirEntriesProxy();
      proxy.returns({ path: '/repo/.dungeonmaster', entries: [] });

      const result = await readdirEntries('/repo/.dungeonmaster');

      expect(result).toStrictEqual([]);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = readdirEntriesProxy();
      proxy.missing({ path: '/repo/missing' });

      await expect(readdirEntries('/repo/missing')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOENT', path: '/repo/missing' }),
      );
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readdirEntriesProxy();
      proxy.denied({ path: '/repo/locked' });

      await expect(readdirEntries('/repo/locked')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked' }),
      );
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readdirEntriesProxy();
      proxy.notADirectory({ path: '/repo/.dungeonmaster.json/nested' });

      await expect(readdirEntries('/repo/.dungeonmaster.json/nested')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOTDIR', path: '/repo/.dungeonmaster.json/nested' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = readdirEntriesProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('.dungeonmaster'),
        entries: [{ name: 'config.json', kind: 'file' }],
      });

      const result = await readdirEntries('/resolved/at/runtime/.dungeonmaster');

      expect(result).toStrictEqual([{ name: 'config.json', kind: 'file' }]);
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = readdirEntriesProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing'),
        error,
      });

      await expect(readdirEntries('/resolved/at/runtime/missing')).rejects.toStrictEqual(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = readdirEntriesProxy();
      proxy.returns({ path: '/repo/.dungeonmaster', entries: [] });

      await readdirEntries('/repo/.dungeonmaster');

      expect(proxy.getCallsFor({ path: '/repo/.dungeonmaster' })).toStrictEqual([
        ['/repo/.dungeonmaster', { withFileTypes: true }],
      ]);
    });
  });
});
