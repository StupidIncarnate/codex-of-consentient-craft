import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

describe('fsWriteFileAdapter', () => {
  describe('writeFile()', () => {
    it('VALID: writes file successfully => resolves', async () => {
      const proxy = fsWriteFileAdapterProxy();

      const filepath = FilePathStub({ value: '/project/.claude/settings.json' });
      const contents = FileContentsStub({ value: '{"hooks": {}}' });

      proxy.succeeds({ filepath, contents });

      await expect(fsWriteFileAdapter({ filepath, contents })).resolves.toBeUndefined();
    });

    it('INVALID: write fails => throws error', async () => {
      const proxy = fsWriteFileAdapterProxy();

      const filepath = FilePathStub({ value: '/readonly/settings.json' });
      const contents = FileContentsStub({ value: '{"hooks": {}}' });
      const error = new Error('EACCES: permission denied');

      proxy.throws({ filepath, error });

      await expect(fsWriteFileAdapter({ filepath, contents })).rejects.toThrow(
        'EACCES: permission denied',
      );
    });
  });
});
