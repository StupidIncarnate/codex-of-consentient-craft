import { fsRenameAdapter } from './fs-rename-adapter';
import { fsRenameAdapterProxy } from './fs-rename-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsRenameAdapter', () => {
  describe('successful renames', () => {
    it('VALID: {from: "/tmp/file.tmp", to: "/tmp/file.json"} => renames file successfully', async () => {
      const proxy = fsRenameAdapterProxy();
      const from = FilePathStub({ value: '/tmp/file.tmp' });
      const to = FilePathStub({ value: '/tmp/file.json' });

      proxy.succeeds();

      await expect(fsRenameAdapter({ from, to })).resolves.toStrictEqual({
        success: true,
      });
    });

    it('VALID: {from, to} => calls rename with correct paths', async () => {
      const proxy = fsRenameAdapterProxy();
      const from = FilePathStub({ value: '/quests/a/quest.json.tmp' });
      const to = FilePathStub({ value: '/quests/a/quest.json' });

      proxy.succeeds();

      await fsRenameAdapter({ from, to });

      expect(proxy.getFromPath()).toBe(from);
      expect(proxy.getToPath()).toBe(to);
    });
  });

  describe('error cases', () => {
    it('ERROR: {from does not exist} => throws ENOENT error', async () => {
      const proxy = fsRenameAdapterProxy();
      const from = FilePathStub({ value: '/nonexistent/file.tmp' });
      const to = FilePathStub({ value: '/nonexistent/file.json' });

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsRenameAdapter({ from, to })).rejects.toThrow(/ENOENT/u);
    });
  });
});
