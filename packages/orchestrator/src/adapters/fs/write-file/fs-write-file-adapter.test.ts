import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';
import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('fsWriteFileAdapter', () => {
  describe('successful writes', () => {
    it('VALID: {filePath: "/test.json", contents: "data"} => writes file successfully', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = FilePathStub({ value: '/test.json' });
      const contents = FileContentsStub({ value: '{"data": "value"}' });

      proxy.succeeds();

      await expect(fsWriteFileAdapter({ filePath, contents })).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: "/readonly.txt"} => throws permission denied error', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = FilePathStub({ value: '/readonly.txt' });
      const contents = FileContentsStub({ value: 'test' });

      proxy.throws({ error: new Error('EACCES: permission denied') });

      await expect(fsWriteFileAdapter({ filePath, contents })).rejects.toThrow(/EACCES/u);
    });
  });
});
