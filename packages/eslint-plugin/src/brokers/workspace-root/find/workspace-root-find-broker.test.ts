import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { workspaceRootFindBroker } from './workspace-root-find-broker';
import { workspaceRootFindBrokerProxy } from './workspace-root-find-broker.proxy';

describe('workspaceRootFindBroker', () => {
  describe('workspaces root found directly', () => {
    it('VALID: {startDir is the workspaces root} => returns rootDir, the root package.json name, and every dependency name', () => {
      const proxy = workspaceRootFindBrokerProxy();
      proxy.setupWorkspaceRoot({
        rootDir: '/repo',
        rootPackageJsonName: 'dungeonmaster',
        packageNames: ['@dungeonmaster/hooks', '@dungeonmaster/orchestrator'],
      });

      const result = workspaceRootFindBroker({
        startDir: FilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({
        rootDir: '/repo',
        rootPackageJsonName: 'dungeonmaster',
        packageNames: ['@dungeonmaster/hooks', '@dungeonmaster/orchestrator'],
      });
    });

    it("VALID: {startDir is a consumer's own workspaces root} => returns that consumer's own root package.json name", () => {
      const proxy = workspaceRootFindBrokerProxy();
      proxy.setupWorkspaceRoot({
        rootDir: '/consumer-repo',
        rootPackageJsonName: '@acme/repo',
        packageNames: [],
      });

      const result = workspaceRootFindBroker({
        startDir: FilePathStub({ value: '/consumer-repo' }),
      });

      expect(result).toStrictEqual({
        rootDir: '/consumer-repo',
        rootPackageJsonName: '@acme/repo',
        packageNames: [],
      });
    });
  });

  describe('workspaces root found by walking up past an ordinary package.json', () => {
    it('VALID: {startDir under a nested package} => climbs past it to the real workspaces root', () => {
      const proxy = workspaceRootFindBrokerProxy();
      proxy.setupNonRootPackageJson({ packageDir: '/repo/packages/eslint-plugin' });
      proxy.setupWorkspaceRoot({
        rootDir: '/repo',
        rootPackageJsonName: 'dungeonmaster',
        packageNames: ['@dungeonmaster/eslint-plugin'],
      });

      const result = workspaceRootFindBroker({
        startDir: FilePathStub({ value: '/repo/packages/eslint-plugin/src/brokers/x' }),
      });

      expect(result).toStrictEqual({
        rootDir: '/repo',
        rootPackageJsonName: 'dungeonmaster',
        packageNames: ['@dungeonmaster/eslint-plugin'],
      });
    });
  });

  describe('no ancestor workspaces root', () => {
    it('EMPTY: {no ancestor package.json carries workspaces} => returns undefined', () => {
      workspaceRootFindBrokerProxy();

      const result = workspaceRootFindBroker({
        startDir: FilePathStub({ value: '/orphan/src' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
