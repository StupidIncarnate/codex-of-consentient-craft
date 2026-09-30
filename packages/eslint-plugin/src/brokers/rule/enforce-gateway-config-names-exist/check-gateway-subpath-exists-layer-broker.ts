/**
 * PURPOSE: Resolves a `#gateway/...` subpath to its barrel file's real path under a workspace root,
 * and answers whether that barrel actually exists on disk — a `#gateway/<folder>/<rest>` subpath maps
 * to `<rootDir>/packages/@gateway/<folder>/src/<rest>/<lastSegment>.ts`, the barrel-naming convention
 * every gateway subpath follows (isGatewayBarrelFileGuard checks the same shape from the other
 * direction). Lets a stale `bannedExports`/`restrictedTo` entry — a renamed or deleted gateway
 * subpath — fail lint instead of silently banning or restricting nothing.
 *
 * USAGE:
 * checkGatewaySubpathExistsLayerBroker({ rootDir: filePathContract.parse('/repo'), subpath: '#gateway/node/fs' });
 * // Returns '/repo/packages/@gateway/node/src/fs/fs.ts' as FilePath, or undefined when it does not exist
 */
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { existsSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';

export const checkGatewaySubpathExistsLayerBroker = ({
  rootDir,
  subpath,
}: {
  rootDir: string;
  subpath: string;
}): string | undefined => {
  const prefix = `${gatewayLocationsStatics.importPrefix}/`;
  if (!subpath.startsWith(prefix)) {
    return undefined;
  }

  const remainder = subpath.slice(prefix.length);
  const [folder, ...rest] = remainder.split('/');
  const knownFolders = Object.values(gatewayLocationsStatics.folders);

  if (
    folder === undefined ||
    !knownFolders.some((knownFolder) => knownFolder === folder) ||
    rest.length === 0
  ) {
    return undefined;
  }

  const lastSegment = rest[rest.length - 1];
  const barrelPath = join(
    rootDir,
    'packages',
    '@gateway',
    folder,
    'src',
    ...rest,
    `${lastSegment}.ts`,
  );

  return existsSync(barrelPath) ? barrelPath : undefined;
};
