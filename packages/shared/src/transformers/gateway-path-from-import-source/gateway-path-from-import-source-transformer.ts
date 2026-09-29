/**
 * PURPOSE: Maps a raw import specifier to the gateway path that replaces it — the mechanical rule
 * a caller-facing lint rule (banning a raw `fs`/`zod`/`@playwright/test` import outside the
 * gateway) and a future migration script both need to agree on byte-for-byte. Strips a leading
 * `node:`; a Node built-in (per Node's own `builtinModules`) maps under `#gateway/node/`, anything else
 * under `#gateway/npm/`. The subpath is the gateway's folder name for the module: the leading `@`
 * dropped, every `/` written as `__`, and a trailing `.js` dropped from each segment
 * (`fs/promises` becomes `fs__promises`, `@playwright/test` becomes `playwright__test`). Built from `gatewayLocationsStatics.importPrefix`, never a repo's own `@scope` — the
 * `#gateway/...` text a lint message suggests must read identically in every consumer repo,
 * whatever that repo names its gateway packages.
 *
 * USAGE:
 * gatewayPathFromImportSourceTransformer({ importSource: ImportPathStub({ value: 'fs' }) });
 * // Returns '#gateway/node/fs' as branded PackageName
 * gatewayPathFromImportSourceTransformer({ importSource: ImportPathStub({ value: 'zod' }) });
 * // Returns '#gateway/npm/zod' as branded PackageName
 * gatewayPathFromImportSourceTransformer({ importSource: ImportPathStub({ value: '@modelcontextprotocol/sdk/types.js' }) });
 * // Returns '#gateway/npm/modelcontextprotocol__sdk__types' as branded PackageName
 */
import { packageNameContract } from '../../contracts/package-name/package-name-contract';
import type { PackageName } from '../../contracts/package-name/package-name-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';
import { builtinModules } from '#gateway/node/module';
import { gatewayLocationsStatics } from '../../statics/gateway-locations/gateway-locations-statics';

const NODE_PREFIX = 'node:';
const JS_EXTENSION = '.js';
const SEGMENT_JOIN = '__';

export const gatewayPathFromImportSourceTransformer = ({
  importSource,
}: {
  importSource: ImportPath;
}): PackageName => {
  const bareModule = importSource.startsWith(NODE_PREFIX)
    ? importSource.slice(NODE_PREFIX.length)
    : importSource;

  const segments = bareModule.split('/');
  const [topLevelSegment] = segments;
  const folderName = segments
    .map((segment) =>
      segment.endsWith(JS_EXTENSION) ? segment.slice(0, -JS_EXTENSION.length) : segment,
    )
    .join(SEGMENT_JOIN)
    .replace(/^@/u, '');

  const gatewayFolder = builtinModules.some((moduleName) => moduleName === topLevelSegment)
    ? gatewayLocationsStatics.folders.node
    : gatewayLocationsStatics.folders.npm;

  return packageNameContract.parse(
    `${gatewayLocationsStatics.importPrefix}/${gatewayFolder}/${folderName}`,
  );
};
