import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { fsReadFileBytesAdapter } from './fs-read-file-bytes-adapter';
import { fsReadFileBytesAdapterProxy } from './fs-read-file-bytes-adapter.proxy';

describe('fsReadFileBytesAdapter', () => {
  describe('successful read', () => {
    it('VALID: {filePath} => returns the bytes read from disk unchanged', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/pasted-image.png' });
      const pngSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const proxy = fsReadFileBytesAdapterProxy();
      proxy.returns({ filePath, bytes: pngSignature });

      const result = await fsReadFileBytesAdapter({ filePath });

      expect(result).toStrictEqual(pngSignature);
    });
  });

  describe('error cases', () => {
    it('ERROR: {read fails} => propagates the error', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/missing-image.png' });
      const proxy = fsReadFileBytesAdapterProxy();
      proxy.throws({ filePath, error: new Error('ENOENT: no such file or directory') });

      await expect(fsReadFileBytesAdapter({ filePath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
