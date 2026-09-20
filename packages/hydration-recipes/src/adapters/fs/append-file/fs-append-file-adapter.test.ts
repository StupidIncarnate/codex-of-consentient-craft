import { fsAppendFileAdapter } from './fs-append-file-adapter';
import { fsAppendFileAdapterProxy } from './fs-append-file-adapter.proxy';
import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('fsAppendFileAdapter', () => {
  describe('successful appends', () => {
    it('VALID: {filePath, contents} => appends and returns success', async () => {
      const proxy = fsAppendFileAdapterProxy();
      const filePath = FilePathStub({ value: '/tmp/dm-home/event-outbox.jsonl' });
      const contents = FileContentsStub({ value: '{"questId":"add-auth"}\n' });
      proxy.succeeds({ filePath });

      const result = await fsAppendFileAdapter({ filePath, contents });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAppendedContents({ filePath })).toBe('{"questId":"add-auth"}\n');
    });
  });
});
