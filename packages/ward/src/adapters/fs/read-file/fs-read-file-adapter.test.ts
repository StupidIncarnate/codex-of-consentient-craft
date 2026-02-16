import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from './fs-read-file-adapter';
import { fsReadFileAdapterProxy } from './fs-read-file-adapter.proxy';

describe('fsReadFileAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {filePath} => returns file contents as branded string', async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/path/to/file.ts' });

      proxy.returns({ content: 'const x = 1;' });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toBe('const x = 1;');
    });

    it('EMPTY: {filePath to empty file} => returns empty branded string', async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/path/to/empty.ts' });

      proxy.returns({ content: '' });

      const result = await fsReadFileAdapter({ filePath });

      expect(result).toBe('');
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: "/nonexistent"} => throws file not found error', async () => {
      const proxy = fsReadFileAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent/file.ts' });

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
