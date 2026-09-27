import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { basename, join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath, FileName } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { packageScaffoldWriteBrokerProxy } from '../../../brokers/package/scaffold-write/package-scaffold-write-broker.proxy';
import { gatewayExistingPackagesListBrokerProxy } from '../../../brokers/gateway/existing-packages-list/gateway-existing-packages-list-broker.proxy';
import { gatewayTsconfigCompilerOptionsWriteBrokerProxy } from '../../../brokers/gateway/tsconfig-compiler-options-write/gateway-tsconfig-compiler-options-write-broker.proxy';
import { gatewaySourceCopyBrokerProxy } from '../../../brokers/gateway/source-copy/gateway-source-copy-broker.proxy';

export const InstallSetupGatewayResponderProxy = (): {
  setupNoRootPackageJson: (params: { rootPackageJsonPath: FilePath }) => void;
  setupRootPackageJson: (params: { rootPackageJsonPath: FilePath; content: string }) => void;
  setupGatewayFolderExists: (params: { packageRoot: FilePath }) => void;
  setupRootTsconfig: (params: { rootTsconfigPath: FilePath; content: string }) => void;
  setupRootTsconfigMissing: (params: { rootTsconfigPath: FilePath }) => void;
  setupExistingPackages: (params: {
    packagesDir: FilePath;
    packages: { name: FileName; hasPackageJson: boolean }[];
  }) => void;
  setupPackageJson: (params: { packageJsonPath: FilePath; content: string }) => void;
  setupPackageTsconfig: (params: { tsconfigPath: FilePath; content: string }) => void;
  setupPackageTsconfigBuildMissing: (params: { tsconfigBuildPath: FilePath }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
  getCopiedSources: () => readonly unknown[];
} => {
  const existsProxy = existsSyncProxy();
  const realPath = requireActual<{ join: typeof join; basename: typeof basename }>({
    module: 'path',
  });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const basenameHandle = registerMock({ fn: basename });
  basenameHandle.calledWith([]).implement((inputPath: never) => realPath.basename(inputPath));
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  packageScaffoldWriteBrokerProxy();
  const existingPackagesProxy = gatewayExistingPackagesListBrokerProxy();
  const tsconfigWriteProxy = gatewayTsconfigCompilerOptionsWriteBrokerProxy();
  const sourceCopyProxy = gatewaySourceCopyBrokerProxy();
  sourceCopyProxy.copySucceeds();

  return {
    setupNoRootPackageJson: ({ rootPackageJsonPath }): void => {
      existsProxy.returns({ path: rootPackageJsonPath, exists: false });
    },

    setupRootPackageJson: ({ rootPackageJsonPath, content }): void => {
      existsProxy.returns({ path: rootPackageJsonPath, exists: true });
      readProxy.resolves({ filePath: rootPackageJsonPath, content });
      writeProxy.succeeds({ filePath: rootPackageJsonPath });
    },

    setupGatewayFolderExists: ({ packageRoot }): void => {
      existsProxy.returns({ path: packageRoot, exists: true });
    },

    setupRootTsconfig: ({ rootTsconfigPath, content }): void => {
      tsconfigWriteProxy.setupFileContent({ tsconfigPath: rootTsconfigPath, content });
    },

    setupRootTsconfigMissing: ({ rootTsconfigPath }): void => {
      tsconfigWriteProxy.setupMissingFile({ tsconfigPath: rootTsconfigPath });
    },

    setupExistingPackages: ({ packagesDir, packages }): void => {
      existingPackagesProxy.setupPackages({ packagesDir, packages });
    },

    setupPackageJson: ({ packageJsonPath, content }): void => {
      readProxy.resolves({ filePath: packageJsonPath, content });
      writeProxy.succeeds({ filePath: packageJsonPath });
    },

    setupPackageTsconfig: ({ tsconfigPath, content }): void => {
      tsconfigWriteProxy.setupFileContent({ tsconfigPath, content });
    },

    setupPackageTsconfigBuildMissing: ({ tsconfigBuildPath }): void => {
      tsconfigWriteProxy.setupMissingFile({ tsconfigPath: tsconfigBuildPath });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),

    getCopiedSources: (): readonly unknown[] => sourceCopyProxy.copiedSources(),
  };
};
