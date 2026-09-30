import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { readJsonFileSyncIfExistsProxy } from '#gateway/node/fs/read-json-file-sync-if-exists/read-json-file-sync-if-exists.proxy';

import { contractIndexBuildBrokerProxy } from '../../contract-index/build/contract-index-build-broker.proxy';

export const ownerIndexBuildBrokerProxy = (): {
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
  readFileSyncProxy();
  readJsonFileSyncIfExistsProxy();
  const indexProxy = contractIndexBuildBrokerProxy();

  return {
    setupSubfolders: indexProxy.setupSubfolders,
    setupPackageJson: indexProxy.setupPackageJson,
    setupWalkedFolder: indexProxy.setupWalkedFolder,
    setupSourceText: indexProxy.setupSourceText,
  };
};
