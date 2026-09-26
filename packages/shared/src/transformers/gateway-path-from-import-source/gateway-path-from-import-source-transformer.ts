/**
 * PURPOSE: Maps a raw import specifier to the gateway path that replaces it — the mechanical rule
 * a caller-facing lint rule (banning a raw `fs`/`zod`/`@playwright/test` import outside the
 * gateway) and a future migration script both need to agree on byte-for-byte. Strips a leading
 * `node:`; a Node built-in (per nodeBuiltinStatics) maps to `<scope>/node/<bareName>`, subpath
 * kept (`fs/promises` stays `fs/promises`); anything else maps to `<scope>/npm/<importSource>`,
 * scoped-package identity kept intact (`@playwright/test` stays `@playwright/test` after the
 * prefix). `scope` is never hard-coded here — pass packageScopeFromNameTransformer's result, read
 * from the repo's own root `package.json`.
 *
 * USAGE:
 * gatewayPathFromImportSourceTransformer({ importSource: ImportPathStub({ value: 'fs' }), scope: PackageNameStub({ value: '@dungeonmaster' }) });
 * // Returns '@dungeonmaster/node/fs' as branded PackageName
 * gatewayPathFromImportSourceTransformer({ importSource: ImportPathStub({ value: 'zod' }), scope: PackageNameStub({ value: '@dungeonmaster' }) });
 * // Returns '@dungeonmaster/npm/zod' as branded PackageName
 */
import { packageNameContract } from '../../contracts/package-name/package-name-contract';
import type { PackageName } from '../../contracts/package-name/package-name-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';
import { nodeBuiltinStatics } from '../../statics/node-builtin/node-builtin-statics';
import { gatewayLocationsStatics } from '../../statics/gateway-locations/gateway-locations-statics';

const NODE_PREFIX = 'node:';

export const gatewayPathFromImportSourceTransformer = ({
  importSource,
  scope,
}: {
  importSource: ImportPath;
  scope: PackageName;
}): PackageName => {
  const bareModule = importSource.startsWith(NODE_PREFIX)
    ? importSource.slice(NODE_PREFIX.length)
    : importSource;

  const [topLevelSegment] = bareModule.split('/');

  if (nodeBuiltinStatics.modules.some((moduleName) => moduleName === topLevelSegment)) {
    return packageNameContract.parse(
      `${scope}/${gatewayLocationsStatics.folders.node}/${bareModule}`,
    );
  }

  return packageNameContract.parse(
    `${scope}/${gatewayLocationsStatics.folders.npm}/${importSource}`,
  );
};
