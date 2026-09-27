import { realpath } from './realpath';
import { realpathProxy } from './realpath.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('realpath', () => {
  describe('successful reads', () => {
    it('VALID: {path: a chain of symlinks} => returns the fully resolved path', async () => {
      const proxy = realpathProxy();
      proxy.returns({
        path: '/repo/.dungeonmaster-assets/siegelense-assets',
        resolved: '/home/user/.dungeonmaster/siegelense',
      });

      const result = await realpath('/repo/.dungeonmaster-assets/siegelense-assets');

      expect(result).toBe('/home/user/.dungeonmaster/siegelense');
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = realpathProxy();
      proxy.missing({ path: '/repo/missing' });

      await expect(realpath('/repo/missing')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOENT', path: '/repo/missing' }),
      );
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = realpathProxy();
      proxy.denied({ path: '/repo/locked' });

      await expect(realpath('/repo/locked')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked' }),
      );
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = realpathProxy();
      proxy.notADirectory({ path: '/repo/.dungeonmaster.json/nested' });

      await expect(realpath('/repo/.dungeonmaster.json/nested')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOTDIR', path: '/repo/.dungeonmaster.json/nested' }),
      );
    });
  });
});
