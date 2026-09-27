import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { findWorkspaceRootLayerBroker } from './find-workspace-root-layer-broker';
import { findWorkspaceRootLayerBrokerProxy } from './find-workspace-root-layer-broker.proxy';

describe('findWorkspaceRootLayerBroker', () => {
  describe('workspaces root found directly', () => {
    it('VALID: {startDir is the workspaces root} => returns rootDir and every dependency name', () => {
      const proxy = findWorkspaceRootLayerBrokerProxy();
      proxy.setupWorkspaceRoot({
        rootDir: '/repo',
        packageNames: ['@dungeonmaster/hooks', '@dungeonmaster/orchestrator'],
      });

      const result = findWorkspaceRootLayerBroker({
        startDir: FilePathStub({ value: '/repo' }),
      });

      expect(result).toStrictEqual({
        rootDir: '/repo',
        packageNames: ['@dungeonmaster/hooks', '@dungeonmaster/orchestrator'],
      });
    });
  });

  describe('workspaces root found by walking up past an ordinary package.json', () => {
    it('VALID: {startDir under a nested package} => climbs past it to the real workspaces root', () => {
      const proxy = findWorkspaceRootLayerBrokerProxy();
      proxy.setupNonRootPackageJson({ packageDir: '/repo/packages/eslint-plugin' });
      proxy.setupWorkspaceRoot({
        rootDir: '/repo',
        packageNames: ['@dungeonmaster/eslint-plugin'],
      });

      const result = findWorkspaceRootLayerBroker({
        startDir: FilePathStub({ value: '/repo/packages/eslint-plugin/src/brokers/x' }),
      });

      expect(result).toStrictEqual({
        rootDir: '/repo',
        packageNames: ['@dungeonmaster/eslint-plugin'],
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
