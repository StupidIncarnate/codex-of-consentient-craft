import { realpath } from './realpath';
import { realpathProxy } from './realpath.proxy';
import { FsErrorStub } from '../fs-error.stub';

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
      const error = FsErrorStub({ code: 'ENOENT' });
      proxy.rejects({ path: '/repo/missing', error });

      await expect(realpath('/repo/missing')).rejects.toBe(error);
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = realpathProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked', error });

      await expect(realpath('/repo/locked')).rejects.toBe(error);
    });

    it('ERROR: {path: a parent segment that is a file} => rejects with the raw ENOTDIR error', async () => {
      const proxy = realpathProxy();
      const error = FsErrorStub({ code: 'ENOTDIR' });
      proxy.rejects({ path: '/repo/.dungeonmaster.json/nested', error });

      await expect(realpath('/repo/.dungeonmaster.json/nested')).rejects.toBe(error);
    });
  });
});
