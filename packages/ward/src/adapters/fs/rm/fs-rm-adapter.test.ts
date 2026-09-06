import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsRmAdapter } from './fs-rm-adapter';
import { fsRmAdapterProxy } from './fs-rm-adapter.proxy';

describe('fsRmAdapter', () => {
  describe('successful removal', () => {
    it('VALID: {filePath, recursive, force} => removes directory and returns success', async () => {
      const proxy = fsRmAdapterProxy();
      const filePath = FilePathStub({ value: '/pkg/node_modules/.vite-40000' });

      proxy.succeeds({ filePath });

      await expect(fsRmAdapter({ filePath, recursive: true, force: true })).resolves.toStrictEqual({
        success: true,
      });
    });

    it('VALID: {filePath only} => removes file and returns success', async () => {
      const proxy = fsRmAdapterProxy();
      const filePath = FilePathStub({ value: '/pkg/report.json' });

      proxy.succeeds({ filePath });

      await expect(fsRmAdapter({ filePath })).resolves.toStrictEqual({ success: true });
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath nonexistent, force omitted} => propagates ENOENT error', async () => {
      const proxy = fsRmAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent' });

      proxy.throws({ filePath, error: new Error('ENOENT: no such file or directory') });

      await expect(fsRmAdapter({ filePath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
