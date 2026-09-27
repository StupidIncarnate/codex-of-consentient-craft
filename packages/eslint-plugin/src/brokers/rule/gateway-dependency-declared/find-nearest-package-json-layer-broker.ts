/**
 * PURPOSE: Reads and parses the nearest ancestor package.json above a linted file — the IMPORTING
 * file's own manifest, never the workspaces root — caching by the resolved directory so a lint run
 * touching thousands of files inside the same package reads and parses that package's manifest once.
 * Distinct from repoScopeResolveBroker (`packages/eslint-plugin/src/brokers/repo-scope/resolve/`),
 * which keeps climbing PAST an ordinary package.json all the way to the workspaces ROOT:
 * gateway-dependency-declared checks against the calling package's OWN `imports`/`dependencies`, not
 * the monorepo root's.
 *
 * USAGE:
 * findNearestPackageJsonLayerBroker({ startDir: filePathContract.parse('/repo/packages/hooks/src/brokers/x') });
 * // Returns { packageJsonPath: '/repo/packages/hooks/package.json', packageJson: {...} }, or
 * // undefined when no ancestor package.json exists
 */
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { gatewayConsumerPackageJsonContract } from '../../../contracts/gateway-consumer-package-json/gateway-consumer-package-json-contract';
import type { GatewayConsumerPackageJson } from '../../../contracts/gateway-consumer-package-json/gateway-consumer-package-json-contract';
import { findPackageJsonDirLayerBroker } from './find-package-json-dir-layer-broker';

const nearestPackageJsonCache = new Map<
  FilePath,
  { packageJsonPath: FilePath; packageJson: GatewayConsumerPackageJson }
>();

export const findNearestPackageJsonLayerBroker = ({
  startDir,
}: {
  startDir: FilePath;
}): { packageJsonPath: FilePath; packageJson: GatewayConsumerPackageJson } | undefined => {
  const packageDir = findPackageJsonDirLayerBroker({ startDir });

  if (packageDir === undefined) {
    return undefined;
  }

  const cached = nearestPackageJsonCache.get(packageDir);
  if (cached) {
    return cached;
  }

  const packageJsonPath = pathJoinAdapter({ paths: [packageDir, 'package.json'] });
  const contents = fsReadFileSyncAdapter({ filePath: packageJsonPath });
  const packageJson = gatewayConsumerPackageJsonContract.parse(JSON.parse(contents));

  const result = { packageJsonPath, packageJson };
  nearestPackageJsonCache.set(packageDir, result);
  return result;
};
