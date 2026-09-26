import { resolveRepoScopeLayerBroker } from './resolve-repo-scope-layer-broker';
import { resolveRepoScopeLayerBrokerProxy } from './resolve-repo-scope-layer-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

describe('resolveRepoScopeLayerBroker', () => {
  describe('workspaces root found immediately', () => {
    it('VALID: {startDir: workspaces root} => returns scope from an already-scoped name', () => {
      const proxy = resolveRepoScopeLayerBrokerProxy();
      const startDir = FilePathStub({ value: '/repo' });
      proxy.setupWorkspaceRoot({
        dirPath: startDir,
        packageJson: { name: '@acme/app', workspaces: ['packages/*'] },
      });

      const result = resolveRepoScopeLayerBroker({ startDir });

      expect(result).toBe('@acme');
    });

    it('VALID: {startDir: workspaces root} => returns scope built from an unscoped name', () => {
      const proxy = resolveRepoScopeLayerBrokerProxy();
      const startDir = FilePathStub({ value: '/dungeonmaster-repo' });
      proxy.setupWorkspaceRoot({
        dirPath: startDir,
        packageJson: { name: 'dungeonmaster', workspaces: ['packages/*'] },
      });

      const result = resolveRepoScopeLayerBroker({ startDir });

      expect(result).toBe('@dungeonmaster');
    });
  });

  describe('workspaces root found after walking up', () => {
    it('VALID: {startDir: nested package} => walks up past a non-root package.json to the workspaces root', () => {
      const proxy = resolveRepoScopeLayerBrokerProxy();
      const rootDir = FilePathStub({ value: '/repo' });
      const nestedDir = FilePathStub({ value: '/repo/eslint-plugin' });
      proxy.setupNonRootPackageJson({
        dirPath: nestedDir,
        packageJson: { name: '@acme/eslint-plugin' },
      });
      proxy.setupWorkspaceRoot({
        dirPath: rootDir,
        packageJson: { name: '@acme/app', workspaces: ['packages/*'] },
      });

      const result = resolveRepoScopeLayerBroker({ startDir: nestedDir });

      expect(result).toBe('@acme');
    });

    it('VALID: {startDir: nested package with no package.json} => walks up to the workspaces root', () => {
      const proxy = resolveRepoScopeLayerBrokerProxy();
      const rootDir = FilePathStub({ value: '/repo' });
      const nestedDir = FilePathStub({ value: '/repo/packages' });
      proxy.setupNoPackageJson({ dirPath: nestedDir });
      proxy.setupWorkspaceRoot({
        dirPath: rootDir,
        packageJson: { name: '@acme/app', workspaces: ['packages/*'] },
      });

      const result = resolveRepoScopeLayerBroker({ startDir: nestedDir });

      expect(result).toBe('@acme');
    });
  });

  describe('no workspaces root reachable', () => {
    it('ERROR: {startDir: below filesystem root, no workspaces root anywhere} => throws', () => {
      const proxy = resolveRepoScopeLayerBrokerProxy();
      const startDir = FilePathStub({ value: '/a' });
      proxy.setupNoPackageJson({ dirPath: startDir });
      proxy.setupNoPackageJson({ dirPath: FilePathStub({ value: '/' }) });

      expect(() => resolveRepoScopeLayerBroker({ startDir })).toThrow(
        /could not find a workspaces root package\.json/u,
      );
    });
  });
});
