import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { fsRealpathAdapter } from './fs-realpath-adapter';
import { fsRealpathAdapterProxy } from './fs-realpath-adapter.proxy';

describe('fsRealpathAdapter', () => {
  describe('successful resolution', () => {
    // Red on an adapter that hands back its argument instead of what realpath answered — the
    // whole reason this adapter exists is that those two values differ for a symlink.
    it('VALID: {filePath: a symlink} => returns the path realpath resolved it to', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/images/link.png' });
      const realPath = AbsoluteFilePathStub({ value: '/tmp/elsewhere/secret.png' });
      const proxy = fsRealpathAdapterProxy();
      proxy.returns({ filePath, realPath });

      const result = await fsRealpathAdapter({ filePath });

      expect(result).toBe('/tmp/elsewhere/secret.png');
    });

    it('VALID: {filePath: a plain file} => returns that same path', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/images/abc.png' });
      const proxy = fsRealpathAdapterProxy();
      proxy.returns({ filePath, realPath: filePath });

      const result = await fsRealpathAdapter({ filePath });

      expect(result).toBe('/tmp/quest/images/abc.png');
    });
  });

  describe('error cases', () => {
    // Red if the adapter ever swallows the rejection into a fallback value — callers decide what a
    // missing path means, and one that reads back as its own argument is indistinguishable from a
    // file that really is there.
    it('ERROR: {nothing exists at filePath} => propagates the error', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/quest/images/missing.png' });
      const proxy = fsRealpathAdapterProxy();
      proxy.throws({
        filePath,
        error: new Error('ENOENT: no such file or directory, lstat /tmp/quest/images/missing.png'),
      });

      await expect(fsRealpathAdapter({ filePath })).rejects.toThrow(/ENOENT/u);
    });
  });
});
