import { AbsoluteFilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';

describe('fsWriteFileAdapter', () => {
  describe('successful write', () => {
    it('VALID: {filePath, content} => writes without throwing', async () => {
      fsWriteFileAdapterProxy();

      const filePath = AbsoluteFilePathStub({ value: '/tmp/test-file.txt' });
      const content = FileContentsStub({ value: 'hello world' });

      await expect(fsWriteFileAdapter({ filePath, content })).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {write fails} => throws error', async () => {
      const proxy = fsWriteFileAdapterProxy();
      proxy.throws({ error: new Error('EACCES: permission denied') });

      const filePath = AbsoluteFilePathStub({ value: '/tmp/test-file.txt' });
      const content = FileContentsStub({ value: 'hello world' });

      await expect(fsWriteFileAdapter({ filePath, content })).rejects.toThrow(/EACCES/u);
    });
  });
});
