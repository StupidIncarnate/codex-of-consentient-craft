import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { worktreeVerifyLinksBroker } from './worktree-verify-links-broker';
import { worktreeVerifyLinksBrokerProxy } from './worktree-verify-links-broker.proxy';

describe('worktreeVerifyLinksBroker', () => {
  describe('a worktree whose links all stay inside it', () => {
    it('VALID: {every link relative and landing inside} => returns success', async () => {
      const proxy = worktreeVerifyLinksBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupNodeModulesPresent({ worktreePath });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: 'ward-link', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/ward-link' }),
        target: '../packages/ward',
      });

      const result = await worktreeVerifyLinksBroker({ worktreePath });

      expect(result).toStrictEqual({ success: true });
    });

    it('EMPTY: {node_modules not populated yet} => returns success without walking anything', async () => {
      const proxy = worktreeVerifyLinksBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupNodeModulesAbsent();

      const result = await worktreeVerifyLinksBroker({ worktreePath });

      expect(result).toStrictEqual({ success: true });
    });

    it('EMPTY: {node_modules present but holding no links} => returns success', async () => {
      const proxy = worktreeVerifyLinksBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupNodeModulesPresent({ worktreePath });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: '.package-lock.json', isDir: false, isSymlink: false }],
      });

      const result = await worktreeVerifyLinksBroker({ worktreePath });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('a worktree that would grade the main checkout', () => {
    it('ERROR: {link stored as an absolute main-checkout path} => rejects naming the link, its target and where it lands', async () => {
      const proxy = worktreeVerifyLinksBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupNodeModulesPresent({ worktreePath });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: '.bin', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/.bin' }),
        target: '/repo/node_modules/.bin',
      });

      const error = await worktreeVerifyLinksBroker({ worktreePath }).catch(
        (thrown: unknown) => thrown,
      );

      expect((error as Error).message).toBe(
        'Worktree preparation failed at verify-links: /repo/worktrees/probe: 1 of 1 node_modules symlink(s) do not resolve inside the worktree, so every command run here would grade the main checkout: /repo/worktrees/probe/node_modules/.bin -> /repo/node_modules/.bin (lands at /repo/node_modules/.bin)',
      );
    });

    it('ERROR: {relative link climbing out of the worktree} => rejects even though the target is relative', async () => {
      const proxy = worktreeVerifyLinksBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupNodeModulesPresent({ worktreePath });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [{ name: 'escapee', isDir: false, isSymlink: true }],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/escapee' }),
        target: '../../../packages/ward',
      });

      const error = await worktreeVerifyLinksBroker({ worktreePath }).catch(
        (thrown: unknown) => thrown,
      );

      expect((error as Error).message).toBe(
        'Worktree preparation failed at verify-links: /repo/worktrees/probe: 1 of 1 node_modules symlink(s) do not resolve inside the worktree, so every command run here would grade the main checkout: /repo/worktrees/probe/node_modules/escapee -> ../../../packages/ward (lands at /repo/packages/ward)',
      );
    });

    it('ERROR: {one bad link beside a good one} => names only the bad one and counts both', async () => {
      const proxy = worktreeVerifyLinksBrokerProxy();
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/probe' });

      proxy.setupNodeModulesPresent({ worktreePath });
      proxy.setupDirectoryEntries({
        dirPath: AbsoluteFilePathStub({ value: '/repo/worktrees/probe/node_modules' }),
        entries: [
          { name: 'good', isDir: false, isSymlink: true },
          { name: 'bad', isDir: false, isSymlink: true },
        ],
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/good' }),
        target: '../packages/shared',
      });
      proxy.setupReadlinkTarget({
        linkPath: FilePathStub({ value: '/repo/worktrees/probe/node_modules/bad' }),
        target: '/repo/node_modules/zod',
      });

      const error = await worktreeVerifyLinksBroker({ worktreePath }).catch(
        (thrown: unknown) => thrown,
      );

      expect((error as Error).message).toBe(
        'Worktree preparation failed at verify-links: /repo/worktrees/probe: 1 of 2 node_modules symlink(s) do not resolve inside the worktree, so every command run here would grade the main checkout: /repo/worktrees/probe/node_modules/bad -> /repo/node_modules/zod (lands at /repo/node_modules/zod)',
      );
    });
  });
});
