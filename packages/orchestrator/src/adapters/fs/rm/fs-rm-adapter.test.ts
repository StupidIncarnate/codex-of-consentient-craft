import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsRmAdapter } from './fs-rm-adapter';
import { fsRmAdapterProxy } from './fs-rm-adapter.proxy';

describe('fsRmAdapter', () => {
  describe('successful removal', () => {
    it('VALID: {filePath, recursive, force} => removes directory and returns success', async () => {
      const proxy = fsRmAdapterProxy();
      const filePath = FilePathStub({ value: '/tmp/smoketest-quest' });

      proxy.succeeds();

      await expect(fsRmAdapter({ filePath, recursive: true, force: true })).resolves.toStrictEqual({
        success: true,
      });
    });

    it('VALID: {filePath only} => removes file and returns success', async () => {
      const proxy = fsRmAdapterProxy();
      const filePath = FilePathStub({ value: '/tmp/file.json' });

      proxy.succeeds();

      await expect(fsRmAdapter({ filePath })).resolves.toStrictEqual({ success: true });
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath nonexistent, force omitted} => propagates ENOENT error', async () => {
      const proxy = fsRmAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent' });

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsRmAdapter({ filePath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
