import { pathExists } from './path-exists';
import { pathExistsProxy } from './path-exists.proxy';
import { FsErrorStub } from '../fs-error.stub';

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
      proxy.rejects({
        path: '/repo/.dungeonmaster.json/nested',
        error: FsErrorStub({ code: 'ENOTDIR' }),
      });

      const result = await pathExists('/repo/.dungeonmaster.json/nested');

      expect(result).toBe(false);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = pathExistsProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked.json', error });

      await expect(pathExists('/repo/locked.json')).rejects.toBe(error);
    });
  });
});
