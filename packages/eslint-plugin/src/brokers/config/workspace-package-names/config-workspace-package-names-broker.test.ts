import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { PackageNameStub } from '@dungeonmaster/shared/contracts/package-name/package-name.stub';
import { configWorkspacePackageNamesBroker } from './config-workspace-package-names-broker';
import { configWorkspacePackageNamesBrokerProxy } from './config-workspace-package-names-broker.proxy';

describe('configWorkspacePackageNamesBroker', () => {
  describe('a real workspaces root found by walking up', () => {
    it('VALID: {startDir nested under the repo root} => returns every member package.json name', () => {
      const proxy = configWorkspacePackageNamesBrokerProxy();
      proxy.setupNoPackageJson({ dir: '/repo/packages/eslint-plugin/src/brokers/config' });
      proxy.setupNoPackageJson({ dir: '/repo/packages/eslint-plugin/src/brokers' });
      proxy.setupNoPackageJson({ dir: '/repo/packages/eslint-plugin/src' });
      proxy.setupNoPackageJson({ dir: '/repo/packages/eslint-plugin' });
      proxy.setupNoPackageJson({ dir: '/repo/packages' });
      proxy.setupWorkspaceRoot({ rootDir: '/repo', rootPackageJsonName: 'dungeonmaster' });
      proxy.setupGlobDirectories({
        basePath: FilePathStub({ value: '/repo/packages' }),
        dirNames: ['orchestrator', 'server'],
      });
      proxy.setupMemberPackageJson({
        memberDir: FilePathStub({ value: '/repo/packages/orchestrator' }),
        name: PackageNameStub({ value: '@dungeonmaster/orchestrator' }),
      });
      proxy.setupMemberPackageJson({
        memberDir: FilePathStub({ value: '/repo/packages/server' }),
        name: PackageNameStub({ value: '@dungeonmaster/server' }),
      });

      const result = configWorkspacePackageNamesBroker({
        startDir: FilePathStub({ value: '/repo/packages/eslint-plugin/src/brokers/config' }),
      });

      expect(result).toStrictEqual(['@dungeonmaster/orchestrator', '@dungeonmaster/server']);
    });
  });

  describe('no workspaces root anywhere', () => {
    it('EMPTY: {no ancestor carries a workspaces field} => returns an empty list', () => {
      const proxy = configWorkspacePackageNamesBrokerProxy();
      proxy.setupNoPackageJson({ dir: '/orphan/src' });
      proxy.setupNoPackageJson({ dir: '/orphan' });
      proxy.setupNoPackageJson({ dir: '/' });

      const result = configWorkspacePackageNamesBroker({
        startDir: FilePathStub({ value: '/orphan/src' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
