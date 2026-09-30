import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { readJsonFileSyncIfExistsProxy } from '#gateway/node/fs/read-json-file-sync-if-exists/read-json-file-sync-if-exists.proxy';
import { walkFilesSyncProxy } from '#gateway/node/fs/walk-files-sync/walk-files-sync.proxy';

import { subfolderPathsListLayerBrokerProxy } from './subfolder-paths-list-layer-broker.proxy';

export const contractIndexBuildBrokerProxy = (): {
  setupSubfolders: ({
    dirPath,
    folders,
  }: {
    dirPath: string;
    folders: readonly string[];
  }) => void;
  setupPackageJson: ({ packageDir, json }: { packageDir: string; json: string }) => void;
  setupWalkedFolder: ({
    dirPath,
    folders,
    files,
  }: {
    dirPath: string;
    folders: readonly string[];
    files: readonly string[];
  }) => void;
  setupSourceText: ({ filePath, text }: { filePath: string; text: string }) => void;
} => {
  const subfolderProxy = subfolderPathsListLayerBrokerProxy();
  const jsonProxy = readJsonFileSyncIfExistsProxy();
  const walkProxy = walkFilesSyncProxy();
  const textProxy = readFileSyncProxy();

  return {
    setupSubfolders: ({
      dirPath,
      folders,
    }: {
      dirPath: string;
      folders: readonly string[];
    }): void => {
      subfolderProxy.setupDirectory({ dirPath, folders, files: [] });
    },

    setupPackageJson: ({
      packageDir,
      json,
    }: {
      packageDir: string;
      json: string;
    }): void => {
      jsonProxy.returns({ path: `${packageDir}/package.json`, json });
    },

    setupWalkedFolder: ({
      dirPath,
      folders,
      files,
    }: {
      dirPath: string;
      folders: readonly string[];
      files: readonly string[];
    }): void => {
      walkProxy.setupDirectory({ dirPath, files, dirs: folders });
      for (const name of files) {
        walkProxy.setupFileStat({ filePath: `${dirPath}/${name}`, sizeBytes: 1, modifiedAtMs: 1 });
      }
    },

    setupSourceText: ({ filePath, text }: { filePath: string; text: string }): void => {
      textProxy.returns({ path: filePath, contents: text });
    },
  };
};
