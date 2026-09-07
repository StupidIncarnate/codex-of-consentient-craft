import {
  AbsoluteFilePathStub,
  ErrorMessageStub,
  FilePathStub,
} from '@dungeonmaster/shared/contracts';

import { worktreePopulateNodeModulesBroker } from './worktree-populate-node-modules-broker';
import { worktreePopulateNodeModulesBrokerProxy } from './worktree-populate-node-modules-broker.proxy';

type StreamedLine = ReturnType<typeof ErrorMessageStub>;

describe('worktreePopulateNodeModulesBroker', () => {
  describe('workspace package carries its own node_modules', () => {
    it('VALID: {workspace package with a react-router-dom-style third-party dep} => symlinks the root-level workspace link and HARDLINKS the per-package third-party entry', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      proxy.setupWorkspacePackageWithNodeModules({
        repoRoot,
        worktreePath,
        packageName: 'web',
        thirdPartyEntry: 'react-router-dom',
      });

      const result = await worktreePopulateNodeModulesBroker({
        repoRoot,
        worktreePath,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllSymlinks()).toStrictEqual([
        {
          target: '../../packages/web',
          linkPath: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/@dungeonmaster/web',
        },
      ]);
      expect(proxy.getAllCopyArgs()).toStrictEqual([
        [
          '-al',
          '/repo/packages/web/node_modules/react-router-dom',
          '/repo/worktrees/quest-slug-a1b2c3d4/packages/web/node_modules',
        ],
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

      const result = await worktreePopulateNodeModulesBroker({
        repoRoot,
        worktreePath,
        onLine: () => undefined,
      });

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
    it('VALID: {repo root with only third-party entries} => hardlinks the root-level entries; no second-level population', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      proxy.setupNoWorkspaceLinks({ repoRoot, worktreePath, thirdPartyEntry: 'zod' });

      const result = await worktreePopulateNodeModulesBroker({
        repoRoot,
        worktreePath,
        onLine: () => undefined,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllSymlinks()).toStrictEqual([]);
      expect(proxy.getAllCopyArgs()).toStrictEqual([
        ['-al', '/repo/node_modules/zod', '/repo/worktrees/quest-slug-a1b2c3d4/node_modules'],
      ]);
    });
  });

  describe('return value', () => {
    it('VALID: {repo root with no node_modules entries at all} => returns success true', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });

      const result = await worktreePopulateNodeModulesBroker({
        repoRoot,
        worktreePath,
        onLine: () => undefined,
      });

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

      await expect(
        worktreePopulateNodeModulesBroker({ repoRoot, worktreePath, onLine: () => undefined }),
      ).rejects.toThrow(/^EACCES: permission denied$/u);
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

      await expect(
        worktreePopulateNodeModulesBroker({ repoRoot, worktreePath, onLine: () => undefined }),
      ).rejects.toThrow(/^EACCES: permission denied$/u);
    });
  });

  describe('live streaming', () => {
    it('VALID: {fresh worktree with one workspace package} => onLine receives one mirroring line per root, root first', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const streamed: StreamedLine[] = [];
      proxy.setupWorkspacePackageWithNodeModules({
        repoRoot,
        worktreePath,
        packageName: 'web',
        thirdPartyEntry: 'react-router-dom',
      });

      await worktreePopulateNodeModulesBroker({
        repoRoot,
        worktreePath,
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(streamed).toStrictEqual([
        '— mirroring node_modules: /repo/worktrees/quest-slug-a1b2c3d4 —',
        '— mirroring node_modules: /repo/worktrees/quest-slug-a1b2c3d4/packages/web —',
      ]);
    });
  });

  describe('resumed after a partial mirror', () => {
    it('VALID: {root already populated, its workspace package not} => mirrors ONLY the package entry and emits a skip line for the root', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const streamed: StreamedLine[] = [];
      proxy.setupWorkspacePackageWithNodeModules({
        repoRoot,
        worktreePath,
        packageName: 'web',
        thirdPartyEntry: 'react-router-dom',
      });
      proxy.setupRootTargetAlreadyPopulated({ worktreePath });

      const result = await worktreePopulateNodeModulesBroker({
        repoRoot,
        worktreePath,
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllSymlinks()).toStrictEqual([]);
      expect(proxy.getAllCopyArgs()).toStrictEqual([
        [
          '-al',
          '/repo/packages/web/node_modules/react-router-dom',
          '/repo/worktrees/quest-slug-a1b2c3d4/packages/web/node_modules',
        ],
      ]);
      expect(streamed).toStrictEqual([
        '— skip /repo/worktrees/quest-slug-a1b2c3d4 (node_modules already populated) —',
        '— mirroring node_modules: /repo/worktrees/quest-slug-a1b2c3d4/packages/web —',
      ]);
    });

    it('VALID: {workspace package already populated, root not} => links ONLY the root entry and emits a skip line for the package', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const streamed: StreamedLine[] = [];
      proxy.setupWorkspacePackageWithNodeModules({
        repoRoot,
        worktreePath,
        packageName: 'web',
        thirdPartyEntry: 'react-router-dom',
      });
      proxy.setupPackageTargetAlreadyPopulated({ worktreePath, packageName: 'web' });

      const result = await worktreePopulateNodeModulesBroker({
        repoRoot,
        worktreePath,
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllSymlinks()).toStrictEqual([
        {
          target: '../../packages/web',
          linkPath: '/repo/worktrees/quest-slug-a1b2c3d4/node_modules/@dungeonmaster/web',
        },
      ]);
      expect(streamed).toStrictEqual([
        '— mirroring node_modules: /repo/worktrees/quest-slug-a1b2c3d4 —',
        '— skip /repo/worktrees/quest-slug-a1b2c3d4/packages/web (node_modules already populated) —',
      ]);
    });

    it('VALID: {both root and its workspace package already populated} => writes ZERO symlinks and emits a skip line for each', async () => {
      const proxy = worktreePopulateNodeModulesBrokerProxy();
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const worktreePath = AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' });
      const streamed: StreamedLine[] = [];
      proxy.setupWorkspacePackageWithNodeModules({
        repoRoot,
        worktreePath,
        packageName: 'web',
        thirdPartyEntry: 'react-router-dom',
      });
      proxy.setupRootTargetAlreadyPopulated({ worktreePath });
      proxy.setupPackageTargetAlreadyPopulated({ worktreePath, packageName: 'web' });

      const result = await worktreePopulateNodeModulesBroker({
        repoRoot,
        worktreePath,
        onLine: (line): void => {
          streamed.push(ErrorMessageStub({ value: line }));
        },
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllSymlinks()).toStrictEqual([]);
      expect(streamed).toStrictEqual([
        '— skip /repo/worktrees/quest-slug-a1b2c3d4 (node_modules already populated) —',
        '— skip /repo/worktrees/quest-slug-a1b2c3d4/packages/web (node_modules already populated) —',
      ]);
    });
  });
});
