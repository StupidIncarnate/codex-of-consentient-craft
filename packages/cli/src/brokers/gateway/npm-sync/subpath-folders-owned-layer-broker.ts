/**
 * PURPOSE: Which `<folder>__*` subpath folders under one gateway `src/` wrap a subpath of the SAME
 * package as `dependency` — `hono__utils__http-status` for `hono`, never `hono__node-server`, which
 * wraps `@hono/node-server` though its name starts the same way. Ownership is read off each
 * candidate's barrel: it belongs when the barrel imports a subpath of this package whose gateway
 * folder name is that folder. A candidate with no barrel belongs to nothing. Used on both sides of
 * the sync — dungeonmaster's own gateway (what to copy) and the consumer's (what already covers the
 * package).
 *
 * USAGE:
 * await subpathFoldersOwnedLayerBroker({ srcRoot, dependency, candidateFolders: ['hono__ws', 'hono__node-server'] });
 * // Returns ['hono__ws']
 */

import { readFileIfExists } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { gatewayPathFromImportSourceTransformer } from '@dungeonmaster/shared/transformers';
import type { GatewayNpmDependency } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';
import { npmPackageNameFromSpecifierTransformer } from '../../../transformers/npm-package-name-from-specifier/npm-package-name-from-specifier-transformer';
import { sourceImportSpecifiersTransformer } from '../../../transformers/source-import-specifiers/source-import-specifiers-transformer';

const NPM_GATEWAY_PATH_PREFIX = `${gatewayLocationsStatics.importPrefix}/${gatewayLocationsStatics.folders.npm}/`;
const BARREL_EXTENSION = '.ts';

export const subpathFoldersOwnedLayerBroker = async ({
  srcRoot,
  dependency,
  candidateFolders,
}: {
  srcRoot: string;
  dependency: GatewayNpmDependency;
  candidateFolders: readonly string[];
}): Promise<readonly string[]> => {
  const subpathPrefix = `${dependency.folder}${gatewayNpmSyncStatics.folders.subpathSeparator}`;

  const owned = await Promise.all(
    candidateFolders
      .filter((candidate) => candidate.startsWith(subpathPrefix))
      .map(async (subpath) => {
        const barrel = await readFileIfExists(
          join(srcRoot, subpath, `${subpath}${BARREL_EXTENSION}`),
        );
        const wrapsPackage =
          barrel !== null &&
          sourceImportSpecifiersTransformer({ sourceText: barrel }).some(
            (specifier) =>
              npmPackageNameFromSpecifierTransformer({ specifier }) === dependency.name &&
              gatewayPathFromImportSourceTransformer({
                importSource: specifier,
                builtinModules: [],
              }) === `${NPM_GATEWAY_PATH_PREFIX}${subpath}`,
          );
        return wrapsPackage ? [subpath] : [];
      }),
  );

  return owned.flat();
};
