/**
 * PURPOSE: Maps a raw import specifier to the gateway path that replaces it — the mechanical rule
 * a caller-facing lint rule (banning a raw `fs`/`zod`/`@playwright/test` import outside the
 * gateway) and a future migration script both need to agree on byte-for-byte. Strips a leading
 * `node:`; a Node built-in (per nodeBuiltinStatics) maps to `#gateway/node/<bareName>`, subpath
 * kept (`fs/promises` stays `fs/promises`); anything else maps to `#gateway/npm/<importSource>`,
 * scoped-package identity kept intact (`@playwright/test` stays `@playwright/test` after the
 * prefix). Built from `gatewayLocationsStatics.importPrefix`, never a repo's own `@scope` — the
 * `#gateway/...` text a lint message suggests must read identically in every consumer repo,
 * whatever that repo names its gateway packages.
 *
 * USAGE:
 * gatewayPathFromImportSourceTransformer({ importSource: ImportPathStub({ value: 'fs' }) });
 * // Returns '#gateway/node/fs' as branded PackageName
 * gatewayPathFromImportSourceTransformer({ importSource: ImportPathStub({ value: 'zod' }) });
 * // Returns '#gateway/npm/zod' as branded PackageName
 */
import { packageNameContract } from '../../contracts/package-name/package-name-contract';
import type { PackageName } from '../../contracts/package-name/package-name-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';
import { nodeBuiltinStatics } from '../../statics/node-builtin/node-builtin-statics';
import { gatewayLocationsStatics } from '../../statics/gateway-locations/gateway-locations-statics';

const NODE_PREFIX = 'node:';

export const gatewayPathFromImportSourceTransformer = ({
  importSource,
}: {
  importSource: ImportPath;
}): PackageName => {
  const bareModule = importSource.startsWith(NODE_PREFIX)
    ? importSource.slice(NODE_PREFIX.length)
    : importSource;

  const [topLevelSegment] = bareModule.split('/');

  if (nodeBuiltinStatics.modules.some((moduleName) => moduleName === topLevelSegment)) {
    return packageNameContract.parse(
      `${gatewayLocationsStatics.importPrefix}/${gatewayLocationsStatics.folders.node}/${bareModule}`,
    );
  }

  return packageNameContract.parse(
    `${gatewayLocationsStatics.importPrefix}/${gatewayLocationsStatics.folders.npm}/${importSource}`,
  );
};
