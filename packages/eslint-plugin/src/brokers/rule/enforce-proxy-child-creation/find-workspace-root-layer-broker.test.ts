import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { findWorkspaceRootLayerBroker } from './find-workspace-root-layer-broker';
import { findWorkspaceRootLayerBrokerProxy } from './find-workspace-root-layer-broker.proxy';

describe('findWorkspaceRootLayerBroker', () => {
  describe('workspaces root found directly', () => {
    it('VALID: {startDir is the workspaces root} => returns rootDir and the root package.json name', () => {
      const proxy = findWorkspaceRootLayerBrokerProxy();
      proxy.setupWorkspaceRoot({
        rootDir: '/repo',
        rootPackageJsonName: 'dungeonmaster',
      });

      const result = findWorkspaceRootLayerBroker({
        startDir: FilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({
        rootDir: '/repo',
        rootPackageJsonName: 'dungeonmaster',
      });
    });

    it("VALID: {startDir is a consumer's own workspaces root} => returns that consumer's own root package.json name", () => {
      const proxy = findWorkspaceRootLayerBrokerProxy();
      proxy.setupWorkspaceRoot({
        rootDir: '/consumer-repo',
        rootPackageJsonName: '@acme/repo',
      });

      const result = findWorkspaceRootLayerBroker({
        startDir: FilePathStub({ value: '/consumer-repo' }),
      });

      expect(result).toStrictEqual({
        rootDir: '/consumer-repo',
        rootPackageJsonName: '@acme/repo',
      });
    });
  });

  describe('workspaces root found by walking up past an ordinary package.json', () => {
    it('VALID: {startDir under a nested package} => climbs past it to the real workspaces root', () => {
      const proxy = findWorkspaceRootLayerBrokerProxy();
      proxy.setupNonRootPackageJson({ packageDir: '/repo/packages/eslint-plugin' });
      proxy.setupWorkspaceRoot({
        rootDir: '/repo',
        rootPackageJsonName: 'dungeonmaster',
      });

      const result = findWorkspaceRootLayerBroker({
        startDir: FilePathStub({ value: '/repo/packages/eslint-plugin/src/brokers/x' }),
      });

      expect(result).toStrictEqual({
        rootDir: '/repo',
        rootPackageJsonName: 'dungeonmaster',
      });
    });
  });

  describe('no ancestor workspaces root', () => {
    it('EMPTY: {no ancestor package.json carries workspaces} => returns undefined', () => {
      findWorkspaceRootLayerBrokerProxy();

      const result = findWorkspaceRootLayerBroker({
        startDir: FilePathStub({ value: '/orphan/src' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
