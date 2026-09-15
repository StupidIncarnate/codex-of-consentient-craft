import { fsSymlinkAdapter } from './fs-symlink-adapter';
import { fsSymlinkAdapterProxy } from './fs-symlink-adapter.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsSymlinkAdapter', () => {
  describe('successful creation', () => {
    it('VALID: {targetPath, linkPath} => creates the symlink successfully', async () => {
      const proxy = fsSymlinkAdapterProxy();
      const targetPath = AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });
      const linkPath = AbsoluteFilePathStub({ value: '/repo/.siegelense' });

      proxy.succeeds({ targetPath, linkPath });

      await expect(fsSymlinkAdapter({ targetPath, linkPath })).resolves.toStrictEqual({
        success: true,
      });
    });

    it('VALID: {targetPath, linkPath} => calls symlink with both paths and the dir type', async () => {
      const proxy = fsSymlinkAdapterProxy();
      const targetPath = AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });
      const linkPath = AbsoluteFilePathStub({ value: '/repo/.siegelense' });

      proxy.succeeds({ targetPath, linkPath });

      await fsSymlinkAdapter({ targetPath, linkPath });

      expect(proxy.getCalls()).toStrictEqual([{ targetPath, linkPath, type: 'dir' }]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {linkPath: already exists} => throws EEXIST error', async () => {
      const proxy = fsSymlinkAdapterProxy();
      const targetPath = AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });
      const linkPath = AbsoluteFilePathStub({ value: '/repo/.siegelense' });

      proxy.throws({
        targetPath,
        linkPath,
        error: Object.assign(new Error('EEXIST: file already exists'), { code: 'EEXIST' }),
      });

      await expect(fsSymlinkAdapter({ targetPath, linkPath })).rejects.toThrow(/EEXIST/u);
    });
  });
});
