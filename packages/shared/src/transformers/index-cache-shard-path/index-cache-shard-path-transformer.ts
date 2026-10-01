/**
 * PURPOSE: The path of one package's shard for one index cache:
 * `<rootDir>/node_modules/.cache/dungeonmaster/<folderName>/<package name, / as __>.json`. Reach for
 * this over building the path by hand, so every index keeps its shards under the same root.
 *
 * USAGE:
 * indexCacheShardPathTransformer({ rootDir: '/repo', folderName: 'owner-index', packageName: '@repo/a' });
 * // Returns '/repo/node_modules/.cache/dungeonmaster/owner-index/@repo__a.json'
 */
import { indexCacheStatics } from '../../statics/index-cache/index-cache-statics';
import { locationsStatics } from '../../statics/locations/locations-statics';

export const indexCacheShardPathTransformer = ({
  rootDir,
  folderName,
  packageName,
}: {
  rootDir: string;
  folderName: string;
  packageName: string;
}): string =>
  `${[rootDir, locationsStatics.repoRoot.nodeModules, ...indexCacheStatics.rootFolderNames, folderName].join('/')}/${packageName.split('/').join('__')}${indexCacheStatics.shardSuffix}`;
