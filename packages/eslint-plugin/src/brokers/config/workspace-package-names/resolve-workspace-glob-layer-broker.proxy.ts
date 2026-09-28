import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, PackageName } from '@dungeonmaster/shared/contracts';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';

export const resolveWorkspaceGlobLayerBrokerProxy = (): {
  setupGlobDirectories: (args: { basePath: FilePath; dirNames: string[] }) => void;
  setupNoBaseDirectory: (args: { basePath: FilePath }) => void;
  setupMemberPackageJson: (args: { memberDir: FilePath; name: PackageName }) => void;
  setupMemberNoPackageJson: (args: { memberDir: FilePath }) => void;
  setupMemberInvalidPackageJson: (args: { memberDir: FilePath; contents: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileSyncProxy();
  const readdirProxy = readdirEntriesSyncProxy();

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
        path: basePath,
        entries: dirNames.map((name) => ({ name, kind: 'directory' as const })),
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
        path: packageJsonPath,
        contents: JSON.stringify({ name }),
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
        path: packageJsonPath,
        contents,
      });
    },
  };
};
