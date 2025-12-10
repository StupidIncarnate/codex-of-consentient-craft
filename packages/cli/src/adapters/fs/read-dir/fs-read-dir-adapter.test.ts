import { fsReadDirAdapter } from './fs-read-dir-adapter';
import { fsReadDirAdapterProxy } from './fs-read-dir-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

describe('fsReadDirAdapter', () => {
  describe('successful reads', () => {
    it('VALID: {dirPath: "/quests"} => returns array of file names', async () => {
      const proxy = fsReadDirAdapterProxy();
      const dirPath = FilePathStub({ value: '/quests' });
      const files = [
        FileNameStub({ value: 'quest-1.json' }),
        FileNameStub({ value: 'quest-2.json' }),
      ];

      proxy.returns({ files });

      const result = await fsReadDirAdapter({ dirPath });

      expect(result).toStrictEqual([
        FileNameStub({ value: 'quest-1.json' }),
        FileNameStub({ value: 'quest-2.json' }),
      ]);
    });

    it('VALID: {dirPath: "/empty-dir"} => returns empty array', async () => {
      const proxy = fsReadDirAdapterProxy();
      const dirPath = FilePathStub({ value: '/empty-dir' });
      const files: ReturnType<typeof FileNameStub>[] = [];

      proxy.returns({ files });

      const result = await fsReadDirAdapter({ dirPath });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {dirPath: "/mixed-files"} => returns all file and directory names', async () => {
      const proxy = fsReadDirAdapterProxy();
      const dirPath = FilePathStub({ value: '/mixed-files' });
      const files = [
        FileNameStub({ value: 'file.txt' }),
        FileNameStub({ value: 'subdir' }),
        FileNameStub({ value: 'quest.json' }),
      ];

      proxy.returns({ files });

      const result = await fsReadDirAdapter({ dirPath });

      expect(result).toStrictEqual([
        FileNameStub({ value: 'file.txt' }),
        FileNameStub({ value: 'subdir' }),
        FileNameStub({ value: 'quest.json' }),
      ]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {dirPath: "/nonexistent"} => throws error', async () => {
      const proxy = fsReadDirAdapterProxy();
      const dirPath = FilePathStub({ value: '/nonexistent' });

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsReadDirAdapter({ dirPath })).rejects.toThrow(/ENOENT/u);
    });

    it('ERROR: {dirPath: "/no-permission"} => throws permission error', async () => {
      const proxy = fsReadDirAdapterProxy();
      const dirPath = FilePathStub({ value: '/no-permission' });

      proxy.throws({ error: new Error('EACCES: permission denied') });

      await expect(fsReadDirAdapter({ dirPath })).rejects.toThrow(/EACCES/u);
    });

    it('ERROR: {dirPath: "/file.txt"} => throws error when path is a file', async () => {
      const proxy = fsReadDirAdapterProxy();
      const dirPath = FilePathStub({ value: '/file.txt' });

      proxy.throws({ error: new Error('ENOTDIR: not a directory') });

      await expect(fsReadDirAdapter({ dirPath })).rejects.toThrow(/ENOTDIR/u);
    });
  });
});
