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
      const error = FsErrorStub({ code: 'ENOENT' });
      proxy.rejects({ path: '/repo/missing', error });

      await expect(readdirEntries('/repo/missing')).rejects.toBe(error);
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readdirEntriesProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked', error });

      await expect(readdirEntries('/repo/locked')).rejects.toBe(error);
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readdirEntriesProxy();
      const error = FsErrorStub({ code: 'ENOTDIR' });
      proxy.rejects({ path: '/repo/.dungeonmaster.json/nested', error });

      await expect(readdirEntries('/repo/.dungeonmaster.json/nested')).rejects.toBe(error);
    });
  });
});
