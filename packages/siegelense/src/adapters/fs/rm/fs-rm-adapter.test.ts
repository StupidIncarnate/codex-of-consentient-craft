import { fsRmAdapter } from './fs-rm-adapter';
import { fsRmAdapterProxy } from './fs-rm-adapter.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

describe('fsRmAdapter', () => {
  describe('successful removals', () => {
    it('VALID: {dirPath} => removes the directory tree successfully', async () => {
      const proxy = fsRmAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' });

      proxy.succeeds({ dirPath });

      await expect(fsRmAdapter({ dirPath })).resolves.toStrictEqual({ success: true });
    });

    it('VALID: {dirPath} => removes the exact directory passed in', async () => {
      const proxy = fsRmAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' });

      proxy.succeeds({ dirPath });

      await fsRmAdapter({ dirPath });

      expect(proxy.getRemovedPaths()).toStrictEqual([dirPath]);
    });

    it('VALID: {dirPath} => passes recursive and force flags', async () => {
      const proxy = fsRmAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' });

      proxy.succeeds({ dirPath });

      await fsRmAdapter({ dirPath });

      expect(proxy.getOptionsFor({ dirPath })).toStrictEqual({ recursive: true, force: true });
    });
  });

  describe('error cases', () => {
    it('ERROR: {dirPath: readonly path} => throws permission denied error', async () => {
      const proxy = fsRmAdapterProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/readonly/dm-siege-inst_7f3a9c21' });

      proxy.throws({ dirPath, error: new Error('EACCES: permission denied') });

      await expect(fsRmAdapter({ dirPath })).rejects.toThrow(/EACCES/u);
    });
  });
});
