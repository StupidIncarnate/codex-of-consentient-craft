import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { fsWriteFileBytesAdapter } from './fs-write-file-bytes-adapter';
import { fsWriteFileBytesAdapterProxy } from './fs-write-file-bytes-adapter.proxy';

describe('fsWriteFileBytesAdapter', () => {
  describe('successful write', () => {
    it('VALID: {filePath, bytes} => writes the bytes verbatim and returns { success: true }', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/pasted-image.png' });
      const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      const proxy = fsWriteFileBytesAdapterProxy();
      proxy.succeeds({ filePath });

      await expect(fsWriteFileBytesAdapter({ filePath, bytes })).resolves.toStrictEqual({
        success: true,
      });
      expect(proxy.writtenArgsFor({ filePath })).toStrictEqual([filePath, bytes]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {write fails} => propagates the error', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/pasted-image.png' });
      const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      const proxy = fsWriteFileBytesAdapterProxy();
      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      await expect(fsWriteFileBytesAdapter({ filePath, bytes })).rejects.toThrow(/EACCES/u);
    });
  });
});
