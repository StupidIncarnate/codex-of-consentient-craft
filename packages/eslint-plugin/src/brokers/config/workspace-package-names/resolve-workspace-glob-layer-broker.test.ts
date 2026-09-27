import { FilePathStub, PackageNameStub } from '@dungeonmaster/shared/contracts';
import { resolveWorkspaceGlobLayerBroker } from './resolve-workspace-glob-layer-broker';
import { resolveWorkspaceGlobLayerBrokerProxy } from './resolve-workspace-glob-layer-broker.proxy';

describe('resolveWorkspaceGlobLayerBroker', () => {
  describe('wildcard glob', () => {
    it('VALID: {glob: "packages/*", two members with valid package.json} => returns both names', () => {
      const proxy = resolveWorkspaceGlobLayerBrokerProxy();
      const rootDir = FilePathStub({ value: '/repo' });
      const basePath = FilePathStub({ value: '/repo/packages' });
      proxy.setupGlobDirectories({ basePath, dirNames: ['orchestrator', 'server'] });
      proxy.setupMemberPackageJson({
        memberDir: FilePathStub({ value: '/repo/packages/orchestrator' }),
        name: PackageNameStub({ value: '@dungeonmaster/orchestrator' }),
      });
      proxy.setupMemberPackageJson({
        memberDir: FilePathStub({ value: '/repo/packages/server' }),
        name: PackageNameStub({ value: '@dungeonmaster/server' }),
      });

      const result = resolveWorkspaceGlobLayerBroker({ rootDir, glob: 'packages/*' });

      expect(result).toStrictEqual(['@dungeonmaster/orchestrator', '@dungeonmaster/server']);
    });

    it('EMPTY: {glob: "packages/*", base directory absent} => returns an empty list', () => {
      const proxy = resolveWorkspaceGlobLayerBrokerProxy();
      const rootDir = FilePathStub({ value: '/repo' });
      proxy.setupNoBaseDirectory({ basePath: FilePathStub({ value: '/repo/packages' }) });

      const result = resolveWorkspaceGlobLayerBroker({ rootDir, glob: 'packages/*' });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {glob: "packages/*", one member has no package.json} => skips that member', () => {
      const proxy = resolveWorkspaceGlobLayerBrokerProxy();
      const rootDir = FilePathStub({ value: '/repo' });
      const basePath = FilePathStub({ value: '/repo/packages' });
      proxy.setupGlobDirectories({ basePath, dirNames: ['orchestrator', 'scratch'] });
      proxy.setupMemberPackageJson({
        memberDir: FilePathStub({ value: '/repo/packages/orchestrator' }),
        name: PackageNameStub({ value: '@dungeonmaster/orchestrator' }),
      });
      proxy.setupMemberNoPackageJson({
        memberDir: FilePathStub({ value: '/repo/packages/scratch' }),
      });

      const result = resolveWorkspaceGlobLayerBroker({ rootDir, glob: 'packages/*' });

      expect(result).toStrictEqual(['@dungeonmaster/orchestrator']);
    });

    it('ERROR: {glob: "packages/*", one member package.json is invalid JSON} => skips that member', () => {
      const proxy = resolveWorkspaceGlobLayerBrokerProxy();
      const rootDir = FilePathStub({ value: '/repo' });
      const basePath = FilePathStub({ value: '/repo/packages' });
      proxy.setupGlobDirectories({ basePath, dirNames: ['orchestrator', 'broken'] });
      proxy.setupMemberPackageJson({
        memberDir: FilePathStub({ value: '/repo/packages/orchestrator' }),
        name: PackageNameStub({ value: '@dungeonmaster/orchestrator' }),
      });
      proxy.setupMemberInvalidPackageJson({
        memberDir: FilePathStub({ value: '/repo/packages/broken' }),
        contents: '{ not valid json',
      });

      const result = resolveWorkspaceGlobLayerBroker({ rootDir, glob: 'packages/*' });

      expect(result).toStrictEqual(['@dungeonmaster/orchestrator']);
    });

    it('INVALID: {glob: "packages/*", one member package.json has no name field} => skips that member', () => {
      const proxy = resolveWorkspaceGlobLayerBrokerProxy();
      const rootDir = FilePathStub({ value: '/repo' });
      const basePath = FilePathStub({ value: '/repo/packages' });
      proxy.setupGlobDirectories({ basePath, dirNames: ['orchestrator', 'unnamed'] });
      proxy.setupMemberPackageJson({
        memberDir: FilePathStub({ value: '/repo/packages/orchestrator' }),
        name: PackageNameStub({ value: '@dungeonmaster/orchestrator' }),
      });
      proxy.setupMemberInvalidPackageJson({
        memberDir: FilePathStub({ value: '/repo/packages/unnamed' }),
        contents: JSON.stringify({ version: '1.0.0' }),
      });

      const result = resolveWorkspaceGlobLayerBroker({ rootDir, glob: 'packages/*' });

      expect(result).toStrictEqual(['@dungeonmaster/orchestrator']);
    });
  });

  describe('literal, non-wildcard glob', () => {
    it('VALID: {glob: "packages/single"} => returns that one member name', () => {
      const proxy = resolveWorkspaceGlobLayerBrokerProxy();
      const rootDir = FilePathStub({ value: '/repo' });
      proxy.setupMemberPackageJson({
        memberDir: FilePathStub({ value: '/repo/packages/single' }),
        name: PackageNameStub({ value: '@dungeonmaster/single' }),
      });

      const result = resolveWorkspaceGlobLayerBroker({ rootDir, glob: 'packages/single' });

      expect(result).toStrictEqual(['@dungeonmaster/single']);
    });
  });
});
