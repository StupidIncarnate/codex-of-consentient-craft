import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsRenameAdapter } from './fs-rename-adapter';
import { fsRenameAdapterProxy } from './fs-rename-adapter.proxy';

describe('fsRenameAdapter', () => {
  describe('successful rename', () => {
    it('VALID: {fromPath, toPath} => moves the path and returns success', async () => {
      const proxy = fsRenameAdapterProxy();
      const fromPath = FilePathStub({ value: '/pkg/.ward/bundle/.tmp-42' });
      const toPath = FilePathStub({ value: '/pkg/.ward/bundle/abc123' });

      proxy.succeeds({ fromPath, toPath });

      await expect(fsRenameAdapter({ fromPath, toPath })).resolves.toStrictEqual({ success: true });
      expect(proxy.getCallsFor({ fromPath })).toStrictEqual([[fromPath, toPath]]);
    });
  });

  describe('destination already published', () => {
    it('ERROR: {toPath already holds a bundle} => rejects with ENOTEMPTY', async () => {
      const proxy = fsRenameAdapterProxy();
      const fromPath = FilePathStub({ value: '/pkg/.ward/bundle/.tmp-43' });
      const toPath = FilePathStub({ value: '/pkg/.ward/bundle/abc123' });

      proxy.losesRace({ fromPath, toPath });

      await expect(fsRenameAdapter({ fromPath, toPath })).rejects.toThrow(/^ENOTEMPTY/u);
    });
  });

  describe('other failures', () => {
    it('ERROR: {fromPath absent} => rejects with ENOENT', async () => {
      const proxy = fsRenameAdapterProxy();
      const fromPath = FilePathStub({ value: '/pkg/.ward/bundle/.tmp-gone' });
      const toPath = FilePathStub({ value: '/pkg/.ward/bundle/abc123' });

      proxy.throws({
        fromPath,
        toPath,
        error: new Error('ENOENT: no such file or directory'),
      });

      await expect(fsRenameAdapter({ fromPath, toPath })).rejects.toThrow(/^ENOENT/u);
    });
  });
});
