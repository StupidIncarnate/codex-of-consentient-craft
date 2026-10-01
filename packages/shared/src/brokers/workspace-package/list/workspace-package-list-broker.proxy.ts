import { readJsonFileSyncIfExistsProxy } from '#gateway/node/fs/read-json-file-sync-if-exists/read-json-file-sync-if-exists.proxy';

import { subfolderPathsListLayerBrokerProxy } from './subfolder-paths-list-layer-broker.proxy';

export const workspacePackageListBrokerProxy = (): {
  setupSubfolders: ({ dirPath, folders }: { dirPath: string; folders: readonly string[] }) => void;
  setupPackageJson: ({ packageDir, json }: { packageDir: string; json: string }) => void;
} => {
  const subfolderProxy = subfolderPathsListLayerBrokerProxy();
  const jsonProxy = readJsonFileSyncIfExistsProxy();

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

    setupPackageJson: ({ packageDir, json }: { packageDir: string; json: string }): void => {
      jsonProxy.returns({ path: `${packageDir}/package.json`, json });
    },
  };
};
