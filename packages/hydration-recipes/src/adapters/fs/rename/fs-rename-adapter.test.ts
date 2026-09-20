import { fsRenameAdapter } from './fs-rename-adapter';
import { fsRenameAdapterProxy } from './fs-rename-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsRenameAdapter', () => {
  describe('successful renames', () => {
    it('VALID: {from, to} => renames and returns success', async () => {
      const proxy = fsRenameAdapterProxy();
      const from = FilePathStub({ value: '/tmp/guild-1/quest.json.tmp' });
      const to = FilePathStub({ value: '/tmp/guild-1/quest.json' });
      proxy.succeeds({ from, to });

      const result = await fsRenameAdapter({ from, to });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
