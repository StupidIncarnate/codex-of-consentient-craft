import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { worktreePopulateNodeModulesBroker } from './worktree-populate-node-modules-broker';
import { worktreePopulateNodeModulesBrokerProxy } from './worktree-populate-node-modules-broker.proxy';

describe('worktreePopulateNodeModulesBroker', () => {
  describe('workspace package carries its own node_modules', () => {
    it('VALID: {workspace package with a react-router-dom-style third-party dep} => links BOTH the root-level workspace link and the per-package third-party entry', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      proxy.setupWorkspacePackageWithNodeModules({
        repoRoot,
        worktreePath,
        packageName: 'web',
        thirdPartyEntry: 'react-router-dom',
      });

      const result = await worktreePopulateNodeModulesBroker({ repoRoot, worktreePath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllSymlinks()).toStrictEqual([
        {
          target: '../../packages/web',
          linkPath: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/@dungeonmaster/web',
        },
        {
          target: '/repo/packages/web/node_modules/react-router-dom',
          linkPath:
            '/repo/worktrees/quest-slug-a1b2c3d4/packages/web/node_modules/react-router-dom',
        },
      ]);
    });
  });

  describe('workspace package has no node_modules of its own', () => {
    it('VALID: {workspace package with no node_modules} => links only the root-level workspace link; the layer is not invoked for that package', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      proxy.setupWorkspacePackageWithoutNodeModules({
        repoRoot,
        worktreePath,
        packageName: 'orchestrator',
      });

      const result = await worktreePopulateNodeModulesBroker({ repoRoot, worktreePath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllSymlinks()).toStrictEqual([
        {
          target: '../../packages/orchestrator',
          linkPath: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/@dungeonmaster/orchestrator',
        },
      ]);
    });
  });

  describe('no workspace links at the root', () => {
    it('VALID: {repo root with only third-party entries} => links only the root-level entries; no second-level population', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      proxy.setupNoWorkspaceLinks({ repoRoot, worktreePath, thirdPartyEntry: 'zod' });

      const result = await worktreePopulateNodeModulesBroker({ repoRoot, worktreePath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllSymlinks()).toStrictEqual([
        {
          target: '/repo/node_modules/zod',
          linkPath: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/zod',
        },
      ]);
    });
  });

  describe('return value', () => {
    it('VALID: {repo root with no node_modules entries at all} => returns success true', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

      const result = await worktreePopulateNodeModulesBroker({ repoRoot, worktreePath });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllSymlinks()).toStrictEqual([]);
    });
  });

  describe('root-level node_modules mkdir rejects', () => {
    it('ERROR: {root-level target node_modules mkdir rejects} => propagates out of the parent', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      proxy.setupMkdirThrows({
        filepath: FilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules' }),
        error: new Error('EACCES: permission denied'),
      });

      await expect(worktreePopulateNodeModulesBroker({ repoRoot, worktreePath })).rejects.toThrow(
        /^EACCES: permission denied$/u,
      );
    });
  });

  describe('per-package population rejects', () => {
    it('ERROR: {per-package populateOneRootLayerBroker call rejects} => propagates out of the parent', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      proxy.setupWorkspacePackagePopulationRejects({
        repoRoot,
        worktreePath,
        packageName: 'orchestrator',
        error: new Error('EACCES: permission denied'),
      });

      await expect(worktreePopulateNodeModulesBroker({ repoRoot, worktreePath })).rejects.toThrow(
        /^EACCES: permission denied$/u,
      );
    });
  });
});
