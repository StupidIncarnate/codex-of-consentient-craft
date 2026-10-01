/**
 * PURPOSE: Reads the version of the @dungeonmaster/shared installed under a repo root — the key every
 * index cache shard carries, so upgrading the package that builds the indexes invalidates every
 * shard an older one wrote. Empty text when none is installed there or it names no version.
 *
 * USAGE:
 * indexCacheSharedVersionBroker({ rootDir: '/repo' });
 * // Returns '0.1.0' — from /repo/node_modules/@dungeonmaster/shared/package.json
 */
import { readJsonFileSyncIfExists } from '#gateway/node/fs';

import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { indexCacheStatics } from '../../../statics/index-cache/index-cache-statics';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const indexCacheSharedVersionBroker = ({ rootDir }: { rootDir: string }): string => {
  const parsed = packageJsonContract.safeParse(
    readJsonFileSyncIfExists(
      [
        rootDir,
        locationsStatics.repoRoot.nodeModules,
        ...indexCacheStatics.sharedPackageFolders,
        'package.json',
      ].join('/'),
    ),
  );
  return parsed.success ? (parsed.data.version ?? '') : '';
};
