import { readJsonFileSyncIfExistsProxy } from '#gateway/node/fs/read-json-file-sync-if-exists/read-json-file-sync-if-exists.proxy';

import { locationsStatics } from '../../../statics/locations/locations-statics';
import { ownerIndexStatics } from '../../../statics/owner-index/owner-index-statics';
import { workspacePackageListBrokerProxy } from '../../workspace-package/list/workspace-package-list-broker.proxy';
import { contractFilesWalkLayerBrokerProxy } from './contract-files-walk-layer-broker.proxy';
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
  const jsonProxy = readJsonFileSyncIfExistsProxy();
  const packagesProxy = workspacePackageListBrokerProxy();
  const walkProxy = contractFilesWalkLayerBrokerProxy();
  const shardProxy = packageShardReadLayerBrokerProxy();

  // Every repo root has @dungeonmaster/shared 0.1.0 installed unless a test says otherwise; an exact
  // setupSharedVersion stage outranks this one.
  const sharedPackageJsonTail = `/${[
    locationsStatics.repoRoot.nodeModules,
    ...ownerIndexStatics.cache.sharedPackageFolders,
    'package.json',
  ].join('/')}`;
  jsonProxy.returnsMatchingPath({
    path: (value: unknown): boolean =>
      typeof value === 'string' && value.endsWith(sharedPackageJsonTail),
    json: '{"name":"@dungeonmaster/shared","version":"0.1.0"}',
  });

  return {
    setupSubfolders: packagesProxy.setupSubfolders,
    setupPackageJson: packagesProxy.setupPackageJson,
    setupWalkedFolder: walkProxy.setupWalkedFolder,
    setupSourceText: shardProxy.setupSourceText,
    setupShard: shardProxy.setupShard,
    writtenShard: shardProxy.writtenShard,
    sourceReadCalls: shardProxy.sourceReadCalls,
    setupSharedVersion: ({ rootDir, version }: { rootDir: string; version: string }): void => {
      jsonProxy.returns({
        path: `${rootDir}${sharedPackageJsonTail}`,
        json: JSON.stringify({ name: '@dungeonmaster/shared', version }),
      });
    },
  };
};
