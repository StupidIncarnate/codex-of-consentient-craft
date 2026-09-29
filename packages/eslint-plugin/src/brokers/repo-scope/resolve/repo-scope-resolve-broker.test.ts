import { repoScopeResolveBroker } from './repo-scope-resolve-broker';
import { repoScopeResolveBrokerProxy } from './repo-scope-resolve-broker.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';

describe('repoScopeResolveBroker', () => {
  describe('workspaces root found immediately', () => {
    it('VALID: {startDir: workspaces root} => returns scope from an already-scoped name', () => {
      const proxy = repoScopeResolveBrokerProxy();
      const startDir = FilePathStub({ value: '/repo' });
      proxy.setupWorkspaceRoot({
        dirPath: startDir,
        packageJson: { name: '@acme/app', workspaces: ['packages/*'] },
      });

      const result = repoScopeResolveBroker({ startDir });

      expect(result).toBe('@acme');
    });

    it('VALID: {startDir: workspaces root} => returns scope built from an unscoped name', () => {
      const proxy = repoScopeResolveBrokerProxy();
      const startDir = FilePathStub({ value: '/dungeonmaster-repo' });
      proxy.setupWorkspaceRoot({
        dirPath: startDir,
        packageJson: { name: 'dungeonmaster', workspaces: ['packages/*'] },
      });

      const result = repoScopeResolveBroker({ startDir });

      expect(result).toBe('@dungeonmaster');
    });
  });

  describe('workspaces root found after walking up', () => {
    it('VALID: {startDir: nested package} => walks up past a non-root package.json to the workspaces root', () => {
      const proxy = repoScopeResolveBrokerProxy();
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

      const result = repoScopeResolveBroker({ startDir: nestedDir });

      expect(result).toBe('@acme');
    });

    it('VALID: {startDir: nested package with no package.json} => walks up to the workspaces root', () => {
      const proxy = repoScopeResolveBrokerProxy();
      const rootDir = FilePathStub({ value: '/repo' });
      const nestedDir = FilePathStub({ value: '/repo/packages' });
      proxy.setupNoPackageJson({ dirPath: nestedDir });
      proxy.setupWorkspaceRoot({
        dirPath: rootDir,
        packageJson: { name: '@acme/app', workspaces: ['packages/*'] },
      });

      const result = repoScopeResolveBroker({ startDir: nestedDir });

      expect(result).toBe('@acme');
    });
  });

  describe('no workspaces root reachable', () => {
    it('ERROR: {startDir: below filesystem root, no workspaces root anywhere} => throws', () => {
      const proxy = repoScopeResolveBrokerProxy();
      const startDir = FilePathStub({ value: '/a' });
      proxy.setupNoPackageJson({ dirPath: startDir });
      proxy.setupNoPackageJson({ dirPath: FilePathStub({ value: '/' }) });

      expect(() => repoScopeResolveBroker({ startDir })).toThrow(
        /could not find a workspaces root package\.json/u,
      );
    });
  });
});
