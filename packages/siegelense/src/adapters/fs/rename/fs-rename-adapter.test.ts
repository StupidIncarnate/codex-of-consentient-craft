import { fsRenameAdapter } from './fs-rename-adapter';
import { fsRenameAdapterProxy } from './fs-rename-adapter.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsRenameAdapter', () => {
  describe('successful renames', () => {
    it('VALID: {fromPath, toPath} => renames the file successfully', async () => {
      const proxy = fsRenameAdapterProxy();
      const fromPath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/registry.json.tmp',
      });
      const toPath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/registry.json',
      });

      proxy.succeeds({ fromPath });

      await expect(fsRenameAdapter({ fromPath, toPath })).resolves.toStrictEqual({
        success: true,
      });
    });

    it('VALID: {fromPath, toPath} => renames onto the exact destination path', async () => {
      const proxy = fsRenameAdapterProxy();
      const fromPath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/registry.json.tmp',
      });
      const toPath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/registry.json',
      });

      proxy.succeeds({ fromPath });

      await fsRenameAdapter({ fromPath, toPath });

      expect(proxy.getToPathFor({ fromPath })).toBe(toPath);
    });
  });

  describe('error cases', () => {
    it('ERROR: {fromPath: missing source} => throws ENOENT error', async () => {
      const proxy = fsRenameAdapterProxy();
      const fromPath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/missing.json.tmp',
      });
      const toPath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/registry.json',
      });

      proxy.throws({ fromPath, error: new Error('ENOENT: no such file or directory') });

      await expect(fsRenameAdapter({ fromPath, toPath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
