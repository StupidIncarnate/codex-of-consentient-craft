import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';
import { FileContentsStub, FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsWriteFileAdapter', () => {
  describe('writeFile()', () => {
    it('VALID: filepath, contents => writes file successfully', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filepath = FilePathStub({ value: '/test/path/file.txt' });
      const contents = FileContentsStub({ value: 'test content' });

      proxy.succeeds({ filepath, contents });

      await expect(fsWriteFileAdapter({ filepath, contents })).resolves.toBeUndefined();
    });

    it('INVALID: write fails => throws error', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filepath = FilePathStub({ value: '/test/path/file.txt' });
      const contents = FileContentsStub({ value: 'test content' });
      const error = new Error('Write failed');

      proxy.throws({ filepath, error });

      await expect(fsWriteFileAdapter({ filepath, contents })).rejects.toThrow('Write failed');
    });
  });
});
