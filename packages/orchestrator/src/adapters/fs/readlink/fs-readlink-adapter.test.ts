import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadlinkAdapter } from './fs-readlink-adapter';
import { fsReadlinkAdapterProxy } from './fs-readlink-adapter.proxy';

describe('fsReadlinkAdapter', () => {
  describe('readable symlinks', () => {
    it('VALID: {linkPath: "/worktree/.../zod"} => returns the absolute target unmodified', async () => {
      const proxy = fsReadlinkAdapterProxy();
      const linkPath = FilePathStub({
        value: '/worktree/node_modules/zod',
      });

      proxy.returns({ linkPath, target: '/repo/node_modules/zod' });

      const result = await fsReadlinkAdapter({ linkPath });

      expect(result).toBe('/repo/node_modules/zod');
    });

    it('VALID: {linkPath: "/worktree/.../orchestrator"} => returns the relative target unmodified', async () => {
      const proxy = fsReadlinkAdapterProxy();
      const linkPath = FilePathStub({
        value: '/worktree/node_modules/@dungeonmaster/orchestrator',
      });

      proxy.returns({ linkPath, target: '../../packages/orchestrator' });

      const result = await fsReadlinkAdapter({ linkPath });

      expect(result).toBe('../../packages/orchestrator');
    });
  });

  describe('unreadable paths', () => {
    it('ERROR: {linkPath does not exist} => returns null on ENOENT', async () => {
      const proxy = fsReadlinkAdapterProxy();
      const linkPath = FilePathStub({
        value: '/worktree/node_modules/missing-package',
      });

      proxy.throws({
        linkPath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), {
          code: 'ENOENT',
        }),
      });

      const result = await fsReadlinkAdapter({ linkPath });

      expect(result).toBe(null);
    });

    it('ERROR: {linkPath is not a symlink} => returns null on EINVAL', async () => {
      const proxy = fsReadlinkAdapterProxy();
      const linkPath = FilePathStub({
        value: '/worktree/node_modules/.bin',
      });

      proxy.throws({
        linkPath,
        error: Object.assign(new Error('EINVAL: invalid argument, readlink'), {
          code: 'EINVAL',
        }),
      });

      const result = await fsReadlinkAdapter({ linkPath });

      expect(result).toBe(null);
    });
  });
});
