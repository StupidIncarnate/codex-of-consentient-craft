/**
 * PURPOSE: Lists every third-party npm package a consumer repo declares in `dependencies` — of the
 * root package.json and of every workspace package — as the gateway folder each one needs under
 * `packages/@gateway/npm/src/`. `devDependencies` are never read: they are tooling, which shipped
 * code does not import through the gateway. The first declaration met wins the
 * range (root first, then workspace packages in directory order). Workspace package names, the
 * gateway packages' own names among them, are never wrapped, and neither is anything in
 * `gatewayNpmSyncStatics.dropped`. Reach for this over `gatewayExistingPackagesListBroker`, which
 * lists package directories, not what they depend on.
 *
 * USAGE:
 * await gatewayNpmDependenciesListBroker({ repoRoot: '/repo' });
 * // Returns [{ name: 'zod', range: '^4.0.0', folder: 'zod' }, { name: '@hono/node-server', range: '^1.0.0', folder: 'hono__node-server' }]
 */

import { readFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { packageJsonRawContract } from '@dungeonmaster/shared/contracts';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';
import { gatewayPathFromImportSourceTransformer } from '@dungeonmaster/shared/transformers';
import { dependencyMapContract } from '../../../contracts/dependency-map/dependency-map-contract';
import {
  gatewayNpmDependencyContract,
  type GatewayNpmDependency,
} from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';
import { gatewayExistingPackagesListBroker } from '../existing-packages-list/gateway-existing-packages-list-broker';

const NPM_GATEWAY_PATH_PREFIX = `${gatewayLocationsStatics.importPrefix}/${gatewayLocationsStatics.folders.npm}/`;

export const gatewayNpmDependenciesListBroker = async ({
  repoRoot,
}: {
  repoRoot: string;
}): Promise<readonly GatewayNpmDependency[]> => {
  const { fileName, nameKey, dependencyKeys } = gatewayNpmSyncStatics.packageJson;
  const packagesDir = join(repoRoot, gatewayNpmSyncStatics.consumerGateway.packagesDirectory);
  const workspaceDirs = gatewayExistingPackagesListBroker({ packagesDir });
  const gatewayDirs = gatewayExistingPackagesListBroker({
    packagesDir: join(packagesDir, gatewayNpmSyncStatics.consumerGateway.gatewayGroupDirectory),
  });

  const [rootPackageJson, ...workspacePackageJsons] = await Promise.all(
    [repoRoot, ...workspaceDirs, ...gatewayDirs].map(async (packageDir) =>
      packageJsonRawContract.parse(JSON.parse(await readFile(join(packageDir, fileName)))),
    ),
  );

  const workspaceNames = new Set(
    workspacePackageJsons.flatMap((packageJson) => {
      const name = packageJson[nameKey];
      return typeof name === 'string' ? [name] : [];
    }),
  );

  const declaringPackageJsons = [
    rootPackageJson,
    ...workspacePackageJsons.slice(0, workspaceDirs.length),
  ];
  const ranges = new Map<string, string>();
  for (const packageJson of declaringPackageJsons) {
    for (const dependencyKey of dependencyKeys) {
      const declared = dependencyMapContract.parse(packageJson?.[dependencyKey] ?? {});
      for (const [name, range] of Object.entries(declared)) {
        if (!ranges.has(name)) {
          ranges.set(name, range);
        }
      }
    }
  }

  const { names: droppedNames, prefixes: droppedPrefixes } = gatewayNpmSyncStatics.dropped;

  return [...ranges.entries()]
    .filter(
      ([name]) =>
        !workspaceNames.has(name) &&
        !droppedNames.some((droppedName) => droppedName === name) &&
        !droppedPrefixes.some((prefix) => name.startsWith(prefix)),
    )
    .map(([name, range]) =>
      gatewayNpmDependencyContract.parse({
        name,
        range,
        folder: gatewayPathFromImportSourceTransformer({
          importSource: name,
          builtinModules: [],
        }).slice(NPM_GATEWAY_PATH_PREFIX.length),
      }),
    );
};
