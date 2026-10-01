import { indexCacheSharedVersionBrokerProxy } from '../../index-cache/shared-version/index-cache-shared-version-broker.proxy';
import { sourceFileWalkBrokerProxy } from '../../source-file/walk/source-file-walk-broker.proxy';
import { workspacePackageListBrokerProxy } from '../../workspace-package/list/workspace-package-list-broker.proxy';
import { contractShardReadLayerBrokerProxy } from './contract-shard-read-layer-broker.proxy';

export const contractIndexAssembleBrokerProxy = (): {
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
  setupSharedVersion: ({ rootDir, version }: { rootDir: string; version: string }) => void;
} => {
  const packagesProxy = workspacePackageListBrokerProxy();
  const walkProxy = sourceFileWalkBrokerProxy();
  const shardProxy = contractShardReadLayerBrokerProxy();
  const versionProxy = indexCacheSharedVersionBrokerProxy();

  return {
    setupSubfolders: packagesProxy.setupSubfolders,
    setupPackageJson: packagesProxy.setupPackageJson,
    setupWalkedFolder: walkProxy.setupWalkedFolder,
    setupSourceText: shardProxy.setupSourceText,
    setupShard: shardProxy.setupShard,
    writtenShard: shardProxy.writtenShard,
    setupSharedVersion: versionProxy.setupSharedVersion,
  };
};
