import {
  pathJoinAdapterProxy,
  pathBasenameAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath, FileName } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { pathRelativeAdapterProxy } from '../../../adapters/path/relative/path-relative-adapter.proxy';
import { packageScaffoldWriteBrokerProxy } from '../../../brokers/package/scaffold-write/package-scaffold-write-broker.proxy';
import { gatewayExistingPackagesListBrokerProxy } from '../../../brokers/gateway/existing-packages-list/gateway-existing-packages-list-broker.proxy';
import { gatewayTsconfigPathsWriteBrokerProxy } from '../../../brokers/gateway/tsconfig-paths-write/gateway-tsconfig-paths-write-broker.proxy';

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
} => {
  pathJoinAdapterProxy();
  pathBasenameAdapterProxy();
  pathRelativeAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  packageScaffoldWriteBrokerProxy();
  const existingPackagesProxy = gatewayExistingPackagesListBrokerProxy();
  const tsconfigWriteProxy = gatewayTsconfigPathsWriteBrokerProxy();

  return {
    setupNoRootPackageJson: ({ rootPackageJsonPath }): void => {
      existsProxy.returns({ filePath: rootPackageJsonPath, result: false });
    },

    setupRootPackageJson: ({ rootPackageJsonPath, content }): void => {
      existsProxy.returns({ filePath: rootPackageJsonPath, result: true });
      readProxy.resolves({ filePath: rootPackageJsonPath, content });
      writeProxy.succeeds({ filePath: rootPackageJsonPath });
    },

    setupGatewayFolderExists: ({ packageRoot }): void => {
      existsProxy.returns({ filePath: packageRoot, result: true });
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
  };
};
