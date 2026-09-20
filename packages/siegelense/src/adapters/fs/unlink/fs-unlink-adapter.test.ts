import { fsUnlinkAdapter } from './fs-unlink-adapter';
import { fsUnlinkAdapterProxy } from './fs-unlink-adapter.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsUnlinkAdapter', () => {
  describe('successful removals', () => {
    it('VALID: {filePath} => removes the file successfully', async () => {
      const proxy = fsUnlinkAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/boot.lock',
      });

      proxy.succeeds({ filePath });

      await expect(fsUnlinkAdapter({ filePath })).resolves.toStrictEqual({ success: true });
    });

    it('VALID: {filePath} => removes the exact path passed in', async () => {
      const proxy = fsUnlinkAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/boot.lock',
      });

      proxy.succeeds({ filePath });

      await fsUnlinkAdapter({ filePath });

      expect(proxy.getDeletedPaths()).toStrictEqual([filePath]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: missing file} => throws ENOENT error', async () => {
      const proxy = fsUnlinkAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/missing.lock',
      });

      proxy.throws({ filePath, error: new Error('ENOENT: no such file or directory') });

      await expect(fsUnlinkAdapter({ filePath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
