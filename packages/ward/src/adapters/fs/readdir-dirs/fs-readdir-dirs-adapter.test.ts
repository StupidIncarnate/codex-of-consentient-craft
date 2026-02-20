import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReaddirDirsAdapter } from './fs-readdir-dirs-adapter';
import { fsReaddirDirsAdapterProxy } from './fs-readdir-dirs-adapter.proxy';

describe('fsReaddirDirsAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {dirPath with subdirs} => returns FileName[] of directory names only', async () => {
      const proxy = fsReaddirDirsAdapterProxy();
      const dirPath = FilePathStub({ value: '/path/to/dir' });

      proxy.returns({ dirs: ['packages', 'src', 'dist'] });

      const result = await fsReaddirDirsAdapter({ dirPath });

      expect(result).toStrictEqual(['packages', 'src', 'dist']);
    });

    it('EMPTY: {dirPath with no subdirs} => returns empty array', async () => {
      const proxy = fsReaddirDirsAdapterProxy();
      const dirPath = FilePathStub({ value: '/path/to/empty' });

      proxy.returns({ dirs: [] });

      const result = await fsReaddirDirsAdapter({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {dirPath: "/nonexistent"} => throws error', async () => {
      const proxy = fsReaddirDirsAdapterProxy();
      const dirPath = FilePathStub({ value: '/nonexistent' });

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsReaddirDirsAdapter({ dirPath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
