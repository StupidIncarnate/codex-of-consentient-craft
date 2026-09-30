/**
 * PURPOSE: Turns a gateway barrel file's path into the `#gateway/<kind>/<module>` text callers
 * import it by. A gateway barrel is `packages/@gateway/<kind>/src/<module>/<module>.ts` (the file
 * named for its own folder); any other file under the gateway is a wrapper or its support, not an
 * import target, and gets null.
 *
 * USAGE:
 * gatewayBarrelImportPathTransformer({ file: censusPath });
 * // Returns '#gateway/node/fs__promises' for packages/@gateway/node/src/fs__promises/fs__promises.ts
 */
import { censusLayoutStatics } from '../../statics/census-layout/census-layout-statics';

const BARREL_PATTERN = /^([^/]+)\/src\/([^/]+)\/\2\.ts$/u;

export const gatewayBarrelImportPathTransformer = ({ file }: { file: string }): string | null => {
  const prefix = `${censusLayoutStatics.gatewayRoot}/`;
  if (!file.startsWith(prefix)) {
    return null;
  }
  const match = BARREL_PATTERN.exec(file.slice(prefix.length));
  if (match === null) {
    return null;
  }
  return `${censusLayoutStatics.gatewayImportPrefix}/${match[1]}/${match[2]}`;
};
