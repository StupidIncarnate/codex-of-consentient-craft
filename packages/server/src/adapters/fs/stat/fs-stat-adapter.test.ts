import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

import { fsStatAdapter } from './fs-stat-adapter';
import { fsStatAdapterProxy } from './fs-stat-adapter.proxy';

describe('fsStatAdapter', () => {
  describe('stat', () => {
    it('VALID: {filePath} => returns stats object', async () => {
      const filePath = FilePathStub({ value: '/test/file.jsonl' });
      const proxy = fsStatAdapterProxy();
      const birthtime = new Date('2025-01-01');
      proxy.returns({
        filePath,
        stats: { birthtime, mtimeMs: 1708473600000 },
      });

      const result = await fsStatAdapter({ filePath });

      expect(result).toStrictEqual({ birthtime, mtimeMs: 1708473600000 });
    });

    it('ERROR: {missing file} => throws error', async () => {
      const filePath = FilePathStub({ value: '/missing/file.jsonl' });
      const proxy = fsStatAdapterProxy();
      proxy.throws({ filePath, error: new Error('ENOENT') });

      await expect(fsStatAdapter({ filePath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
