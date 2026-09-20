import { AbsoluteFilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

import { fsWriteTextAdapter } from './fs-write-text-adapter';
import { fsWriteTextAdapterProxy } from './fs-write-text-adapter.proxy';

describe('fsWriteTextAdapter', () => {
  describe('successful writes', () => {
    it('VALID: {filePath, contents} => creates the parent directory then writes the contents', async () => {
      const proxy = fsWriteTextAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/tmp/dm-siege-x/.claude/projects/-tmp-repo/sess-1.jsonl',
      });
      proxy.succeeds({ filePath });

      const result = await fsWriteTextAdapter({
        filePath,
        contents: FileContentsStub({ value: '{"type":"user"}\n' }),
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.writtenTo({ filePath })).toBe('{"type":"user"}\n');
      expect(proxy.directoriesCreated()).toStrictEqual([
        '/tmp/dm-siege-x/.claude/projects/-tmp-repo',
      ]);
    });
  });

  describe('failed writes', () => {
    it('ERROR: {write rejects} => propagates the error', async () => {
      const proxy = fsWriteTextAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/dm-siege-x/sess-1.jsonl' });
      proxy.throwsOnWrite({ filePath, error: new Error('EACCES: permission denied') });

      await expect(
        fsWriteTextAdapter({ filePath, contents: FileContentsStub({ value: 'x' }) }),
      ).rejects.toThrow(/EACCES: permission denied/u);
    });
  });
});
