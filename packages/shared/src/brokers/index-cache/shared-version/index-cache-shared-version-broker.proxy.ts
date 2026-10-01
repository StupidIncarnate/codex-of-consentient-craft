import { readJsonFileSyncIfExistsProxy } from '#gateway/node/fs/read-json-file-sync-if-exists/read-json-file-sync-if-exists.proxy';

import { indexCacheStatics } from '../../../statics/index-cache/index-cache-statics';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const indexCacheSharedVersionBrokerProxy = (): {
  setupSharedVersion: ({ rootDir, version }: { rootDir: string; version: string }) => void;
  setupNoSharedInstalled: ({ rootDir }: { rootDir: string }) => void;
} => {
  const jsonProxy = readJsonFileSyncIfExistsProxy();
  const sharedPackageJsonTail = `/${[
    locationsStatics.repoRoot.nodeModules,
    ...indexCacheStatics.sharedPackageFolders,
    'package.json',
  ].join('/')}`;

  // Every repo root has @dungeonmaster/shared 0.1.0 installed unless a test says otherwise; an exact
  // stage outranks this one.
  jsonProxy.returnsMatchingPath({
    path: (value: unknown): boolean =>
      typeof value === 'string' && value.endsWith(sharedPackageJsonTail),
    json: '{"name":"@dungeonmaster/shared","version":"0.1.0"}',
  });

  return {
    setupSharedVersion: ({ rootDir, version }: { rootDir: string; version: string }): void => {
      jsonProxy.returns({
        path: `${rootDir}${sharedPackageJsonTail}`,
        json: JSON.stringify({ name: '@dungeonmaster/shared', version }),
      });
    },
    setupNoSharedInstalled: ({ rootDir }: { rootDir: string }): void => {
      jsonProxy.missing({ path: `${rootDir}${sharedPackageJsonTail}` });
    },
  };
};
