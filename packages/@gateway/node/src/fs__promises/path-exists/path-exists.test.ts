import { pathExists } from './path-exists';
import { pathExistsProxy } from './path-exists.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('pathExists', () => {
  describe('present path', () => {
    it('VALID: {path: existing} => returns true', async () => {
      const proxy = pathExistsProxy();
      proxy.present({ path: '/repo/.dungeonmaster.json' });

      const result = await pathExists('/repo/.dungeonmaster.json');

      expect(result).toBe(true);
    });
  });

  describe('absent path', () => {
    it('EMPTY: {path: missing} => returns false', async () => {
      const proxy = pathExistsProxy();
      proxy.missing({ path: '/repo/missing.json' });

      const result = await pathExists('/repo/missing.json');

      expect(result).toBe(false);
    });

    it('EDGE: {path: a parent segment that is a file} => returns false on ENOTDIR', async () => {
      const proxy = pathExistsProxy();
      proxy.notADirectory({ path: '/repo/.dungeonmaster.json/nested' });

      const result = await pathExists('/repo/.dungeonmaster.json/nested');

      expect(result).toBe(false);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = pathExistsProxy();
      proxy.denied({ path: '/repo/locked.json' });

      await expect(pathExists('/repo/locked.json')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked.json' }),
      );
    });
  });
});
