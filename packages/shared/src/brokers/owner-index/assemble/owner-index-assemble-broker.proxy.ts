import { readJsonFileSyncIfExistsProxy } from '#gateway/node/fs/read-json-file-sync-if-exists/read-json-file-sync-if-exists.proxy';

import { indexCacheSharedVersionBrokerProxy } from '../../index-cache/shared-version/index-cache-shared-version-broker.proxy';
import { sourceFileWalkBrokerProxy } from '../../source-file/walk/source-file-walk-broker.proxy';
import { workspacePackageListBrokerProxy } from '../../workspace-package/list/workspace-package-list-broker.proxy';
import { packageShardReadLayerBrokerProxy } from './package-shard-read-layer-broker.proxy';

export const ownerIndexAssembleBrokerProxy = (): {
  setupSubfolders: ({ dirPath, folders }: { dirPath: string; folders: readonly string[] }) => void;
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
  setupShard: ({ shardPath, contents }: { shardPath: string; contents: string }) => void;
  writtenShard: ({ shardPath }: { shardPath: string }) => unknown;
  sourceReadCalls: ({ filePath }: { filePath: string }) => readonly unknown[][];
  setupSharedVersion: ({ rootDir, version }: { rootDir: string; version: string }) => void;
} => {
  readJsonFileSyncIfExistsProxy();
  const packagesProxy = workspacePackageListBrokerProxy();
  const walkProxy = sourceFileWalkBrokerProxy();
  const shardProxy = packageShardReadLayerBrokerProxy();
  const versionProxy = indexCacheSharedVersionBrokerProxy();

  return {
    setupSubfolders: packagesProxy.setupSubfolders,
    setupPackageJson: packagesProxy.setupPackageJson,
    setupWalkedFolder: walkProxy.setupWalkedFolder,
    setupSourceText: shardProxy.setupSourceText,
    setupShard: shardProxy.setupShard,
    writtenShard: shardProxy.writtenShard,
    sourceReadCalls: shardProxy.sourceReadCalls,
    setupSharedVersion: versionProxy.setupSharedVersion,
  };
};
