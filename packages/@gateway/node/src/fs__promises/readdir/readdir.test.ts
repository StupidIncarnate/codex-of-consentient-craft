import { readdir } from './readdir';
import { readdirProxy } from './readdir.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readdir', () => {
  describe('successful reads', () => {
    it('VALID: {path: directory with entries} => returns their names', async () => {
      const proxy = readdirProxy();
      proxy.returns({
        path: '/repo/.dungeonmaster/quests',
        names: ['quest-1.json', 'quest-2.json'],
      });

      const result = await readdir('/repo/.dungeonmaster/quests');

      expect(result).toStrictEqual(['quest-1.json', 'quest-2.json']);
    });
  });

  describe('empty directory', () => {
    it('EMPTY: {path: an empty directory} => returns an empty array', async () => {
      const proxy = readdirProxy();
      proxy.returns({ path: '/repo/.dungeonmaster/quests', names: [] });

      const result = await readdir('/repo/.dungeonmaster/quests');

      expect(result).toStrictEqual([]);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = readdirProxy();
      const error = FsErrorStub({ code: 'ENOENT' });
      proxy.rejects({ path: '/repo/missing', error });

      await expect(readdir('/repo/missing')).rejects.toBe(error);
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readdirProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked', error });

      await expect(readdir('/repo/locked')).rejects.toBe(error);
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readdirProxy();
      const error = FsErrorStub({ code: 'ENOTDIR' });
      proxy.rejects({ path: '/repo/.dungeonmaster.json/nested', error });

      await expect(readdir('/repo/.dungeonmaster.json/nested')).rejects.toBe(error);
    });
  });
});
