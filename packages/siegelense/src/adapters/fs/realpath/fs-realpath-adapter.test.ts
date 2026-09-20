import { fsRealpathAdapter } from './fs-realpath-adapter';
import { fsRealpathAdapterProxy } from './fs-realpath-adapter.proxy';
import { FilePathStub, AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsRealpathAdapter', () => {
  describe('successful resolution', () => {
    it('VALID: {filePath: a symlink onto the siegelense root} => returns the resolved target', async () => {
      const proxy = fsRealpathAdapterProxy();
      const filePath = FilePathStub({ value: '/repo/.siegelense' });
      const expectedTarget = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense',
      });

      proxy.resolves({ filePath, resolvedPath: expectedTarget });

      const result = await fsRealpathAdapter({ filePath });

      expect(result).toBe(expectedTarget);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: does not exist} => rejects with the underlying error', async () => {
      const proxy = fsRealpathAdapterProxy();
      const filePath = FilePathStub({ value: '/repo/.siegelense' });
      const notFoundError = Object.assign(new Error('ENOENT: no such file or directory'), {
        code: 'ENOENT',
      });

      proxy.rejects({ filePath, error: notFoundError });

      await expect(fsRealpathAdapter({ filePath })).rejects.toThrow(
        'ENOENT: no such file or directory',
      );
    });
  });
});
