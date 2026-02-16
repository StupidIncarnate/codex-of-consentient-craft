import { FilePathStub, FileNameStub } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapter } from './fs-readdir-adapter';
import { fsReaddirAdapterProxy } from './fs-readdir-adapter.proxy';

describe('fsReaddirAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {dirPath} => returns array of branded filenames', async () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = FilePathStub({ value: '/path/to/dir' });

      proxy.returns({ entries: ['file1.ts', 'file2.ts'] });

      const result = await fsReaddirAdapter({ dirPath });

      expect(result).toStrictEqual([
        FileNameStub({ value: 'file1.ts' }),
        FileNameStub({ value: 'file2.ts' }),
      ]);
    });

    it('EMPTY: {dirPath to empty dir} => returns empty array', async () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = FilePathStub({ value: '/path/to/empty' });

      proxy.returns({ entries: [] });

      const result = await fsReaddirAdapter({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {dirPath: "/nonexistent"} => throws directory not found error', async () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = FilePathStub({ value: '/nonexistent' });

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsReaddirAdapter({ dirPath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
