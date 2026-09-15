import { fsReadFileAdapter } from './fs-read-file-adapter';
import { fsReadFileAdapterProxy } from './fs-read-file-adapter.proxy';
import { AbsoluteFilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('fsReadFileAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {filePath: registry.json} => returns the file contents', async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/registry.json',
      });
      const expectedContent = FileContentsStub({ value: '{"instances":[]}' });

      proxy.resolves({ filePath, content: expectedContent });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toStrictEqual(expectedContent);
    });

    it('EMPTY: {filePath: freshly created boot.lock} => returns an empty string', async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/boot.lock',
      });
      const expectedContent = FileContentsStub({ value: '' });

      proxy.resolves({ filePath, content: expectedContent });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toStrictEqual(expectedContent);
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: does not exist} => throws wrapped error naming the path', async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/missing.json',
      });
      const notFoundError = Object.assign(new Error('ENOENT: no such file or directory'), {
        code: 'ENOENT',
      });

      proxy.rejects({ filePath, error: notFoundError });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
        `Failed to read file at ${filePath}`,
      );
    });
  });
});
