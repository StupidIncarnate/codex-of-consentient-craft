import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsUnlinkAdapter } from './fs-unlink-adapter';
import { fsUnlinkAdapterProxy } from './fs-unlink-adapter.proxy';

describe('fsUnlinkAdapter', () => {
  describe('successful deletion', () => {
    it('VALID: {filePath} => removes file successfully', async () => {
      const proxy = fsUnlinkAdapterProxy();
      const filePath = FilePathStub({ value: '/path/to/file.ts' });

      proxy.succeeds();

      await expect(fsUnlinkAdapter({ filePath })).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {filePath: "/nonexistent"} => throws file not found error', async () => {
      const proxy = fsUnlinkAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent/file.ts' });

      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      await expect(fsUnlinkAdapter({ filePath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
