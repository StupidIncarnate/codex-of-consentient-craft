import { fsEnsureWriteAdapter } from './fs-ensure-write-adapter';
import { fsEnsureWriteAdapterProxy } from './fs-ensure-write-adapter.proxy';
import { AbsoluteFilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('fsEnsureWriteAdapter', () => {
  describe('a missing parent directory', () => {
    it('VALID: {filePath, content} => calls mkdir with the dirname and recursive true, then writes', async () => {
      const proxy = fsEnsureWriteAdapterProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/home/user/.dungeonmaster/guilds/g1/guild.json',
      });
      const content = FileContentsStub({ value: '{"id":"g1"}' });
      proxy.succeeds({ filePath, content });

      const result = await fsEnsureWriteAdapter({ filePath, content });

      expect(proxy.mkdirCalls().map((call) => call)).toStrictEqual([
        ['/home/user/.dungeonmaster/guilds/g1', { recursive: true }],
      ]);
      expect(proxy.writeCalls().map((call) => call)).toStrictEqual([[filePath, content]]);
      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('the underlying write rejects', () => {
    it('ERROR: {writeFile rejects EACCES} => rejects with the cause', async () => {
      const proxy = fsEnsureWriteAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/readonly/guild.json' });
      const content = FileContentsStub({ value: '{}' });
      proxy.writeFails({
        filePath,
        error: new Error("EACCES: permission denied, open '/readonly/guild.json'"),
      });

      await expect(fsEnsureWriteAdapter({ filePath, content })).rejects.toThrow(
        /EACCES: permission denied/u,
      );
    });
  });
});
