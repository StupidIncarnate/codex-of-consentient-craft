import { readdirIfExists } from './readdir-if-exists';
import { readdirIfExistsProxy } from './readdir-if-exists.proxy';
import { FsErrorStub } from '../fs-error.stub';

describe('readdirIfExists', () => {
  describe('successful reads', () => {
    it('VALID: {path: directory with entries} => returns their names', async () => {
      const proxy = readdirIfExistsProxy();
      proxy.returns({ path: '/repo/.dungeonmaster/quests', names: ['quest-1.json'] });

      const result = await readdirIfExists('/repo/.dungeonmaster/quests');

      expect(result).toStrictEqual(['quest-1.json']);
    });

    it('EMPTY: {path: an existing but empty directory} => returns an empty array, not null', async () => {
      const proxy = readdirIfExistsProxy();
      proxy.returns({ path: '/repo/.dungeonmaster/quests', names: [] });

      const result = await readdirIfExists('/repo/.dungeonmaster/quests');

      expect(result).toStrictEqual([]);
    });
  });

  describe('missing directory', () => {
    it('EMPTY: {path: missing} => returns null, distinct from an empty array', async () => {
      const proxy = readdirIfExistsProxy();
      proxy.missing({ path: '/repo/missing' });

      const result = await readdirIfExists('/repo/missing');

      expect(result).toBe(null);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readdirIfExistsProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked', error });

      await expect(readdirIfExists('/repo/locked')).rejects.toBe(error);
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = readdirIfExistsProxy();
      const error = FsErrorStub({ code: 'ENOTDIR' });
      proxy.rejects({ path: '/repo/.dungeonmaster.json/nested', error });

      await expect(readdirIfExists('/repo/.dungeonmaster.json/nested')).rejects.toBe(error);
    });
  });
});
