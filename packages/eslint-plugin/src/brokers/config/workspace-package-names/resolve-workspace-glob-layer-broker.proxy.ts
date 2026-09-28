import { filePathContract, fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, PackageName } from '@dungeonmaster/shared/contracts';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { fsReaddirSyncAdapterProxy } from '../../../adapters/fs/readdir-sync/fs-readdir-sync-adapter.proxy';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

export const resolveWorkspaceGlobLayerBrokerProxy = (): {
  setupGlobDirectories: (args: { basePath: FilePath; dirNames: string[] }) => void;
  setupNoBaseDirectory: (args: { basePath: FilePath }) => void;
  setupMemberPackageJson: (args: { memberDir: FilePath; name: PackageName }) => void;
  setupMemberNoPackageJson: (args: { memberDir: FilePath }) => void;
  setupMemberInvalidPackageJson: (args: { memberDir: FilePath; contents: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = fsReadFileSyncAdapterProxy();
  const readdirProxy = fsReaddirSyncAdapterProxy();

  return {
    setupGlobDirectories: ({
      basePath,
      dirNames,
    }: {
      basePath: FilePath;
      dirNames: string[];
    }): void => {
      existsProxy.returns({ path: basePath, exists: true });
      readdirProxy.returns({
        dirPath: basePath,
        entries: dirNames.map((name) => ({
          name: FileNameStub({ value: name }),
          isDirectory: true,
        })),
      });
    },

    setupNoBaseDirectory: ({ basePath }: { basePath: FilePath }): void => {
      existsProxy.returns({ path: basePath, exists: false });
    },

    setupMemberPackageJson: ({
      memberDir,
      name,
    }: {
      memberDir: FilePath;
      name: PackageName;
    }): void => {
      const packageJsonPath = filePathContract.parse(`${memberDir}/package.json`);
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readProxy.returns({
        filePath: packageJsonPath,
        contents: fileContentsContract.parse(JSON.stringify({ name })),
      });
    },

    setupMemberNoPackageJson: ({ memberDir }: { memberDir: FilePath }): void => {
      const packageJsonPath = filePathContract.parse(`${memberDir}/package.json`);
      existsProxy.returns({ path: packageJsonPath, exists: false });
    },

    setupMemberInvalidPackageJson: ({
      memberDir,
      contents,
    }: {
      memberDir: FilePath;
      contents: string;
    }): void => {
      const packageJsonPath = filePathContract.parse(`${memberDir}/package.json`);
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readProxy.returns({
        filePath: packageJsonPath,
        contents: fileContentsContract.parse(contents),
      });
    },
  };
};
