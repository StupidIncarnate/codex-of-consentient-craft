import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { resolveWorkspaceRootLayerBroker } from './resolve-workspace-root-layer-broker';
import { resolveWorkspaceRootLayerBrokerProxy } from './resolve-workspace-root-layer-broker.proxy';

describe('resolveWorkspaceRootLayerBroker', () => {
  describe('the workspace root is above the package', () => {
    it('VALID: {a package two levels under the root} => returns the root', async () => {
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const packagesDir = AbsoluteFilePathStub({ value: '/repo/packages' });
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/packages/web' });
      const proxy = resolveWorkspaceRootLayerBrokerProxy();
      proxy.isAPlainPackage({ dirPath: packageRoot, name: '@dm/web' });
      proxy.hasNoManifest({ dirPath: packagesDir });
      proxy.declaresWorkspaces({ dirPath: repoRoot, patterns: ['packages/*'] });

      const result = await resolveWorkspaceRootLayerBroker({ startPath: packageRoot });

      expect(result).toBe('/repo');
    });
  });

  describe('the start path is itself the workspace root', () => {
    it('VALID: {startPath declares workspaces} => returns it without walking up', async () => {
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const proxy = resolveWorkspaceRootLayerBrokerProxy();
      proxy.declaresWorkspaces({ dirPath: repoRoot, patterns: ['packages/*'] });

      const result = await resolveWorkspaceRootLayerBroker({ startPath: repoRoot });

      expect(result).toBe('/repo');
    });
  });

  describe('nothing declares workspaces', () => {
    it('EMPTY: {no ancestor declares workspaces} => returns null', async () => {
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/solo' });
      const proxy = resolveWorkspaceRootLayerBrokerProxy();
      proxy.isAPlainPackage({ dirPath: packageRoot, name: 'solo' });
      proxy.isAPlainPackage({ dirPath: repoRoot, name: 'outer' });

      const result = await resolveWorkspaceRootLayerBroker({ startPath: packageRoot });

      expect(result).toBe(null);
    });

    it('EMPTY: {an empty workspaces array} => keeps walking and returns null', async () => {
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/solo' });
      const proxy = resolveWorkspaceRootLayerBrokerProxy();
      proxy.isAPlainPackage({ dirPath: packageRoot, name: 'solo' });
      proxy.declaresWorkspaces({ dirPath: repoRoot, patterns: [] });

      const result = await resolveWorkspaceRootLayerBroker({ startPath: packageRoot });

      expect(result).toBe(null);
    });
  });

  describe('manifests that say nothing', () => {
    it('EDGE: {an unparseable manifest below the root} => keeps walking and finds the root', async () => {
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/broken' });
      const proxy = resolveWorkspaceRootLayerBrokerProxy();
      proxy.hasAnUnparseableManifest({ dirPath: packageRoot });
      proxy.declaresWorkspaces({ dirPath: repoRoot, patterns: ['packages/*'] });

      const result = await resolveWorkspaceRootLayerBroker({ startPath: packageRoot });

      expect(result).toBe('/repo');
    });

    it('EDGE: {no manifest at all below the root} => keeps walking and finds the root', async () => {
      const repoRoot = AbsoluteFilePathStub({ value: '/repo' });
      const packageRoot = AbsoluteFilePathStub({ value: '/repo/nothing' });
      const proxy = resolveWorkspaceRootLayerBrokerProxy();
      proxy.hasNoManifest({ dirPath: packageRoot });
      proxy.declaresWorkspaces({ dirPath: repoRoot, patterns: ['packages/*'] });

      const result = await resolveWorkspaceRootLayerBroker({ startPath: packageRoot });

      expect(result).toBe('/repo');
    });
  });
});
