import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';
import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('fsWriteFileAdapter', () => {
  describe('successful writes', () => {
    it('VALID: {filePath, contents} => writes and returns success', async () => {
      const proxy = fsWriteFileAdapterProxy();
      const filePath = FilePathStub({ value: '/tmp/guild-1/quest.json' });
      const contents = FileContentsStub({ value: '{"id":"add-auth"}' });
      proxy.succeeds({ filePath });

      const result = await fsWriteFileAdapter({ filePath, contents });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getWrittenContents({ filePath })).toBe('{"id":"add-auth"}');
    });
  });
});
