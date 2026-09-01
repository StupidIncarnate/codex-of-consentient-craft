import { AbsoluteFilePathStub, PastedImageUploadStub } from '@dungeonmaster/shared/contracts';
import { fsWriteFileBase64Adapter } from './fs-write-file-base64-adapter';
import { fsWriteFileBase64AdapterProxy } from './fs-write-file-base64-adapter.proxy';

describe('fsWriteFileBase64Adapter', () => {
  describe('successful write', () => {
    it('VALID: {filePath, dataBase64} => writes the payload with base64 encoding and returns { success: true }', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/pasted-image.png' });
      const { dataBase64 } = PastedImageUploadStub();
      const proxy = fsWriteFileBase64AdapterProxy();
      proxy.succeeds({ filePath });

      await expect(fsWriteFileBase64Adapter({ filePath, dataBase64 })).resolves.toStrictEqual({
        success: true,
      });
      expect(proxy.writtenArgsFor({ filePath })).toStrictEqual([filePath, dataBase64, 'base64']);
    });
  });

  describe('error cases', () => {
    it('ERROR: {write fails} => propagates the error', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/pasted-image.png' });
      const { dataBase64 } = PastedImageUploadStub();
      const proxy = fsWriteFileBase64AdapterProxy();
      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      await expect(fsWriteFileBase64Adapter({ filePath, dataBase64 })).rejects.toThrow(/EACCES/u);
    });
  });
});
