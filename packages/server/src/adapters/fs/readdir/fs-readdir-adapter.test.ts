import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

import { fsReaddirAdapter } from './fs-readdir-adapter';
import { fsReaddirAdapterProxy } from './fs-readdir-adapter.proxy';

describe('fsReaddirAdapter', () => {
  describe('readdir', () => {
    it('VALID: {dirPath with files} => returns file names', async () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = FilePathStub({ value: '/test/dir' });
      proxy.returns({ files: ['file1.jsonl', 'file2.jsonl'] });

      const result = await fsReaddirAdapter({ dirPath });

      expect(result).toStrictEqual(['file1.jsonl', 'file2.jsonl']);
    });

    it('EMPTY: {empty directory} => returns empty array', async () => {
      fsReaddirAdapterProxy();
      const dirPath = FilePathStub({ value: '/test/empty' });

      const result = await fsReaddirAdapter({ dirPath });

      expect(result).toStrictEqual([]);
    });

    it('ERROR: {missing directory} => throws error', async () => {
      const proxy = fsReaddirAdapterProxy();
      const dirPath = FilePathStub({ value: '/missing/dir' });
      proxy.throws({ error: new Error('ENOENT') });

      await expect(fsReaddirAdapter({ dirPath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
