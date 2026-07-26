import { AbsoluteFilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';

describe('fsWriteFileAdapter', () => {
  describe('successful write', () => {
    it('VALID: {filePath, content} => writes without throwing', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test-file.txt' });
      const content = FileContentsStub({ value: 'hello world' });
      const proxy = fsWriteFileAdapterProxy();
      proxy.succeeds({ filePath });

      await expect(fsWriteFileAdapter({ filePath, content })).resolves.toStrictEqual({
        success: true,
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {write fails} => throws error', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test-file.txt' });
      const content = FileContentsStub({ value: 'hello world' });
      const proxy = fsWriteFileAdapterProxy();
      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      await expect(fsWriteFileAdapter({ filePath, content })).rejects.toThrow(/EACCES/u);
    });
  });
});
