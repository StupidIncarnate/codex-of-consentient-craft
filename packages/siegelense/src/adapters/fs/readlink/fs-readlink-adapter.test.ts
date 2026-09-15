import { fsReadlinkAdapter } from './fs-readlink-adapter';
import { fsReadlinkAdapterProxy } from './fs-readlink-adapter.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsReadlinkAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {linkPath: a symlink onto the siegelense root} => returns the stored target', async () => {
      const proxy = fsReadlinkAdapterProxy();
      const linkPath = AbsoluteFilePathStub({ value: '/repo/.siegelense' });
      const expectedTarget = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense',
      });

      proxy.resolves({ linkPath, resolvedTarget: expectedTarget });

      const result = await fsReadlinkAdapter({ linkPath });

      expect(result).toBe(expectedTarget);
    });
  });

  describe('error cases', () => {
    it('ERROR: {linkPath: does not exist} => rejects with the underlying error', async () => {
      const proxy = fsReadlinkAdapterProxy();
      const linkPath = AbsoluteFilePathStub({ value: '/repo/.siegelense' });
      const notFoundError = Object.assign(new Error('ENOENT: no such file or directory'), {
        code: 'ENOENT',
      });

      proxy.rejects({ linkPath, error: notFoundError });

      await expect(fsReadlinkAdapter({ linkPath })).rejects.toThrow(
        'ENOENT: no such file or directory',
      );
    });
  });
});
