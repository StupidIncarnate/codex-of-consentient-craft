import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsSymlinkAdapter } from './fs-symlink-adapter';
import { fsSymlinkAdapterProxy } from './fs-symlink-adapter.proxy';

describe('fsSymlinkAdapter', () => {
  describe('successful symlinks', () => {
    it('VALID: {target: "/packages/orchestrator", linkPath: "/worktree/.../orchestrator"} => returns success and calls symlink with (target, linkPath) in order', async () => {
      const proxy = fsSymlinkAdapterProxy();
      const target = FilePathStub({ value: '/repo/packages/orchestrator' });
      const linkPath = FilePathStub({
        value: '/worktree/node_modules/@dungeonmaster/orchestrator',
      });

      proxy.succeeds({ target });

      const result = await fsSymlinkAdapter({ target, linkPath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getLinkPathFor({ target })).toBe(linkPath);
    });

    it('VALID: {target: "../../packages/orchestrator"} => relative target reaches symlink byte-identical', async () => {
      const proxy = fsSymlinkAdapterProxy();
      const target = FilePathStub({ value: '../../packages/orchestrator' });
      const linkPath = FilePathStub({
        value: '/worktree/node_modules/@dungeonmaster/orchestrator',
      });

      proxy.succeeds({ target });

      await fsSymlinkAdapter({ target, linkPath });

      expect(proxy.getAllSymlinks()).toStrictEqual([
        { target: '../../packages/orchestrator', linkPath },
      ]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {target already exists at linkPath} => propagates the rejection', async () => {
      const proxy = fsSymlinkAdapterProxy();
      const target = FilePathStub({ value: '../../packages/orchestrator' });
      const linkPath = FilePathStub({
        value: '/worktree/node_modules/@dungeonmaster/orchestrator',
      });

      proxy.throws({
        target,
        error: new Error('EEXIST: file already exists'),
      });

      await expect(fsSymlinkAdapter({ target, linkPath })).rejects.toThrow(
        /^EEXIST: file already exists$/u,
      );
    });
  });
});
