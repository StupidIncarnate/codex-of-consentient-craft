import type { PackageName } from '@dungeonmaster/shared/contracts';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';

export const resolveWorkspaceGlobLayerBrokerProxy = (): {
  setupGlobDirectories: (args: { basePath: string; dirNames: string[] }) => void;
  setupNoBaseDirectory: (args: { basePath: string }) => void;
  setupMemberPackageJson: (args: { memberDir: string; name: PackageName }) => void;
  setupMemberNoPackageJson: (args: { memberDir: string }) => void;
  setupMemberInvalidPackageJson: (args: { memberDir: string; contents: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileSyncProxy();
  const readdirProxy = readdirEntriesSyncProxy();

  return {
    setupGlobDirectories: ({
      basePath,
      dirNames,
    }: {
      basePath: string;
      dirNames: string[];
    }): void => {
      existsProxy.returns({ path: basePath, exists: true });
      readdirProxy.returns({
        path: basePath,
        entries: dirNames.map((name) => ({ name, kind: 'directory' as const })),
      });
    },

    setupNoBaseDirectory: ({ basePath }: { basePath: string }): void => {
      existsProxy.returns({ path: basePath, exists: false });
    },

    setupMemberPackageJson: ({
      memberDir,
      name,
    }: {
      memberDir: string;
      name: PackageName;
    }): void => {
      const packageJsonPath = `${memberDir}/package.json`;
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readProxy.returns({
        path: packageJsonPath,
        contents: JSON.stringify({ name }),
      });
    },

    setupMemberNoPackageJson: ({ memberDir }: { memberDir: string }): void => {
      const packageJsonPath = `${memberDir}/package.json`;
      existsProxy.returns({ path: packageJsonPath, exists: false });
    },

    setupMemberInvalidPackageJson: ({
      memberDir,
      contents,
    }: {
      memberDir: string;
      contents: string;
    }): void => {
      const packageJsonPath = `${memberDir}/package.json`;
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readProxy.returns({
        path: packageJsonPath,
        contents,
      });
    },
  };
};
