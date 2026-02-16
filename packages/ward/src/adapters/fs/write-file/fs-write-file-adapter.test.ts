import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';

describe('fsWriteFileAdapter', () => {
  describe('successful writes', () => {
    it('VALID: {filePath, contents} => writes file successfully', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = FilePathStub({ value: '/path/to/file.ts' });
      const contents = FileContentsStub({ value: 'const x = 1;' });

      proxy.succeeds();

      await expect(fsWriteFileAdapter({ filePath, contents })).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: "/readonly/file.ts"} => throws permission error', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = FilePathStub({ value: '/readonly/file.ts' });
      const contents = FileContentsStub({ value: 'content' });

      proxy.throws({ error: new Error('EACCES: permission denied') });

      await expect(fsWriteFileAdapter({ filePath, contents })).rejects.toThrow(/EACCES/u);
    });
  });
});
