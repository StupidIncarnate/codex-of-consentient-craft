/**
 * PURPOSE: The version of one package as the consumer's npm gateway would load it — Node's own
 * `node_modules` lookup order from `fromDirectory` (`createRequire(...).resolve.paths`), cut off at
 * the repo root so a global install or a parent folder's `node_modules` never counts, and the first
 * `<dir>/<name>/package.json` found there read for its `version`. Reading the manifest directly
 * rather than `require.resolve('<name>/package.json')` keeps a package whose `exports` map hides its
 * package.json findable. Null when nothing inside the repo has it installed, or its manifest names
 * no version.
 *
 * USAGE:
 * await installedVersionLayerBroker({ repoRoot: '/repo', fromDirectory: '/repo/packages/@gateway/npm', packageName: 'zod' });
 * // Returns '3.23.8', or null when zod is not installed anywhere inside /repo
 */

import { readJsonFileIfExists } from '#gateway/node/fs__promises';
import { createRequire } from '#gateway/node/module';
import { join, sep } from '#gateway/node/path';
import type { GatewayNpmDependency } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import {
  npmInstalledManifestContract,
  type NpmInstalledManifest,
} from '../../../contracts/npm-installed-manifest/npm-installed-manifest-contract';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';

export const installedVersionLayerBroker = async ({
  repoRoot,
  fromDirectory,
  packageName,
}: {
  repoRoot: string;
  fromDirectory: string;
  packageName: GatewayNpmDependency['name'];
}): Promise<NonNullable<NpmInstalledManifest['version']> | null> => {
  const { fileName } = gatewayNpmSyncStatics.packageJson;
  const searchDirectories = (
    createRequire(join(fromDirectory, fileName)).resolve.paths(packageName) ?? []
  ).filter((directory) => directory.startsWith(`${repoRoot}${sep}`));

  const manifests = await Promise.all(
    searchDirectories.map(async (directory) =>
      readJsonFileIfExists(join(directory, packageName, fileName)),
    ),
  );
  const found = manifests.find((manifest) => manifest !== null);

  return found === undefined ? null : (npmInstalledManifestContract.parse(found).version ?? null);
};
