import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { fsCopyFileAdapter } from './fs-copy-file-adapter';
import { fsCopyFileAdapterProxy } from './fs-copy-file-adapter.proxy';

describe('fsCopyFileAdapter', () => {
  describe('successful copies', () => {
    it('VALID: {sourcePath, destinationPath} => copies the file successfully', async () => {
      const proxy = fsCopyFileAdapterProxy();
      const sourcePath = AbsoluteFilePathStub({
        value: '/tmp/frame1.png',
      });
      const destinationPath = AbsoluteFilePathStub({
        value: '/tmp/shot.png',
      });

      proxy.succeeds({ sourcePath });

      await expect(fsCopyFileAdapter({ sourcePath, destinationPath })).resolves.toStrictEqual({
        success: true,
      });
    });

    it('VALID: {sourcePath, destinationPath} => copies to the exact destination path', async () => {
      const proxy = fsCopyFileAdapterProxy();
      const sourcePath = AbsoluteFilePathStub({
        value: '/tmp/frame1.png',
      });
      const destinationPath = AbsoluteFilePathStub({
        value: '/tmp/shot.png',
      });

      proxy.succeeds({ sourcePath });

      await fsCopyFileAdapter({ sourcePath, destinationPath });

      expect(proxy.getDestinationPathFor({ sourcePath })).toBe(destinationPath);
    });
  });

  describe('error cases', () => {
    it('ERROR: {sourcePath: missing file} => throws ENOENT error', async () => {
      const proxy = fsCopyFileAdapterProxy();
      const sourcePath = AbsoluteFilePathStub({
        value: '/tmp/missing.png',
      });
      const destinationPath = AbsoluteFilePathStub({
        value: '/tmp/shot.png',
      });

      proxy.throws({ sourcePath, error: new Error('ENOENT: no such file or directory') });

      await expect(fsCopyFileAdapter({ sourcePath, destinationPath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
