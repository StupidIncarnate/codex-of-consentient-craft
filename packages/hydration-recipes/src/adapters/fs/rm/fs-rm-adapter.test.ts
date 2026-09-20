import { fsRmAdapter } from './fs-rm-adapter';
import { fsRmAdapterProxy } from './fs-rm-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsRmAdapter', () => {
  describe('successful removes', () => {
    it('VALID: {filePath} => removes and returns success', async () => {
      const proxy = fsRmAdapterProxy();
      const filePath = FilePathStub({ value: '/tmp/guild-1/seed-session-1.jsonl' });
      proxy.succeeds({ filePath });

      const result = await fsRmAdapter({ filePath });

      expect(result).toStrictEqual({ success: true });
    });

    it('VALID: {filePath, recursive, force} => removes a whole directory', async () => {
      const proxy = fsRmAdapterProxy();
      const filePath = FilePathStub({ value: '/tmp/guild-1/quests/001-add-auth' });
      proxy.succeeds({ filePath });

      const result = await fsRmAdapter({ filePath, recursive: true, force: true });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
