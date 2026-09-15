import { dirname } from 'path';
import { fsEnsureWriteAdapter } from './fs-ensure-write-adapter';
import { fsEnsureWriteAdapterProxy } from './fs-ensure-write-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

describe('fsEnsureWriteAdapter', () => {
  describe('ensureWrite()', () => {
    it('VALID: {filepath in a directory that does not exist yet} => creates the directory then writes the file', async () => {
      const proxy = fsEnsureWriteAdapterProxy();

      const filepath = FilePathStub({ value: '/project/.claude/settings.json' });
      const contents = FileContentsStub({ value: '{"hooks": {}}' });

      proxy.succeeds({ filepath, contents });

      await expect(fsEnsureWriteAdapter({ filepath, contents })).resolves.toStrictEqual({
        success: true,
      });

      expect(proxy.getMkdirCallsFor({ filepath })).toStrictEqual([
        [dirname(filepath), { recursive: true }],
      ]);
    });

    it('INVALID: write fails after the directory is created => throws error', async () => {
      const proxy = fsEnsureWriteAdapterProxy();

      const filepath = FilePathStub({ value: '/readonly/settings.json' });
      const contents = FileContentsStub({ value: '{"hooks": {}}' });
      const error = new Error('EACCES: permission denied');

      proxy.throws({ filepath, error });

      await expect(fsEnsureWriteAdapter({ filepath, contents })).rejects.toThrow(
        /EACCES: permission denied/u,
      );
    });
  });
});
