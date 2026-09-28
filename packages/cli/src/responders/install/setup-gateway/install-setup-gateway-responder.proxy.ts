import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { basename, join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath, FileName } from '@dungeonmaster/shared/contracts';
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
  const readProxy = readFileProxy();
  const writeProxy = writeFileProxy();
  packageScaffoldWriteBrokerProxy();
  const existingPackagesProxy = gatewayExistingPackagesListBrokerProxy();
  const tsconfigWriteProxy = gatewayTsconfigCompilerOptionsWriteBrokerProxy();
  const sourceCopyProxy = gatewaySourceCopyBrokerProxy();
  sourceCopyProxy.copySucceeds();
  // Every candidate write path, in the order the responder itself would reach it: a direct
  // package.json write (rootPackageJsonPath/packageJsonPath, answered by writeProxy) or a
  // tsconfig write routed through the composed broker (rootTsconfigPath/tsconfigPath, answered by
  // tsconfigWriteProxy). getWrittenFiles checks both sources per candidate and drops the ones that
  // were never actually written.
  const writeCandidates: FilePath[] = [];

  return {
    setupNoRootPackageJson: ({ rootPackageJsonPath }): void => {
      existsProxy.returns({ path: rootPackageJsonPath, exists: false });
    },

    setupRootPackageJson: ({ rootPackageJsonPath, content }): void => {
      existsProxy.returns({ path: rootPackageJsonPath, exists: true });
      readProxy.returns({ path: rootPackageJsonPath, contents: content });
      writeProxy.succeeds({ path: rootPackageJsonPath });
      writeCandidates.push(rootPackageJsonPath);
    },

    setupGatewayFolderExists: ({ packageRoot }): void => {
      existsProxy.returns({ path: packageRoot, exists: true });
    },

    setupRootTsconfig: ({ rootTsconfigPath, content }): void => {
      tsconfigWriteProxy.setupFileContent({ tsconfigPath: rootTsconfigPath, content });
      writeCandidates.push(rootTsconfigPath);
    },

    setupRootTsconfigMissing: ({ rootTsconfigPath }): void => {
      tsconfigWriteProxy.setupMissingFile({ tsconfigPath: rootTsconfigPath });
    },

    setupExistingPackages: ({ packagesDir, packages }): void => {
      existingPackagesProxy.setupPackages({ packagesDir, packages });
    },

    setupPackageJson: ({ packageJsonPath, content }): void => {
      readProxy.returns({ path: packageJsonPath, contents: content });
      writeProxy.succeeds({ path: packageJsonPath });
      writeCandidates.push(packageJsonPath);
    },

    setupPackageTsconfig: ({ tsconfigPath, content }): void => {
      tsconfigWriteProxy.setupFileContent({ tsconfigPath, content });
      writeCandidates.push(tsconfigPath);
    },

    setupPackageTsconfigBuildMissing: ({ tsconfigBuildPath }): void => {
      tsconfigWriteProxy.setupMissingFile({ tsconfigPath: tsconfigBuildPath });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeCandidates.flatMap((path) => {
        const directContent = writeProxy.writtenContentsFor({ path });
        if (directContent !== undefined) {
          return [{ path, content: directContent }];
        }
        const tsconfigContent = tsconfigWriteProxy.getWrittenContent({ tsconfigPath: path });
        return tsconfigContent === undefined ? [] : [{ path, content: tsconfigContent }];
      }),

    getCopiedSources: (): readonly unknown[] => sourceCopyProxy.copiedSources(),
  };
};
