/**
 * PURPOSE: Records in the consumer's `packages/@gateway/npm/package.json` `dependencies` or
 * `devDependencies` every package the sync just wrote a folder for, at the range the consumer
 * declared it with — ward's duplicate-install check reads that list, and a wrapper whose package
 * the gateway does not declare resolves only by accident of hoisting. A name already listed keeps
 * its range untouched, and the file is rewritten only when something was added — with entries
 * sorted by name, as npm keeps it.
 *
 * USAGE:
 * await gatewayPackageRecordLayerBroker({ npmPackageRoot: '/repo/packages/@gateway/npm', dependencies });
 * // Returns true when package.json gained a dependency, false when every one was already listed
 */

import { readFile, writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { packageJsonRawContract } from '@dungeonmaster/shared/contracts';
import { jsonFileContentsTransformer } from '@dungeonmaster/shared/transformers';
import { dependencyMapContract } from '../../../contracts/dependency-map/dependency-map-contract';
import type { GatewayNpmDependency } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency-contract';
import { gatewayNpmSyncStatics } from '../../../statics/gateway-npm-sync/gateway-npm-sync-statics';

export const gatewayPackageRecordLayerBroker = async ({
  npmPackageRoot,
  dependencies,
}: {
  npmPackageRoot: string;
  dependencies: readonly GatewayNpmDependency[];
}): Promise<boolean> => {
  const { fileName, recordKey, devRecordKey } = gatewayNpmSyncStatics.packageJson;
  const packageJsonPath = join(npmPackageRoot, fileName);
  const packageJson = packageJsonRawContract.parse(JSON.parse(await readFile(packageJsonPath)));
  const recordedProd = dependencyMapContract.parse(packageJson[recordKey] ?? {});
  const recordedDev = dependencyMapContract.parse(packageJson[devRecordKey] ?? {});

  const prodAdditions = dependencies.filter(
    ({ name, location }) => location !== 'devDependencies' && !Object.hasOwn(recordedProd, name),
  );
  const devAdditions = dependencies.filter(
    ({ name, location }) => location === 'devDependencies' && !Object.hasOwn(recordedDev, name),
  );

  if (prodAdditions.length === 0 && devAdditions.length === 0) {
    return false;
  }

  const updatedProd = {
    ...recordedProd,
    ...Object.fromEntries(prodAdditions.map(({ name, range }) => [name, range] as const)),
  };

  const updatedDev = {
    ...recordedDev,
    ...Object.fromEntries(devAdditions.map(({ name, range }) => [name, range] as const)),
  };

  const updatedPackageJson: Record<string, unknown> = {
    ...packageJson,
  };

  if (Object.keys(updatedProd).length > 0 || Object.hasOwn(packageJson, recordKey)) {
    updatedPackageJson[recordKey] = Object.fromEntries(
      Object.entries(updatedProd).sort(([left], [right]) => left.localeCompare(right, 'en')),
    );
  }

  if (Object.keys(updatedDev).length > 0 || Object.hasOwn(packageJson, devRecordKey)) {
    updatedPackageJson[devRecordKey] = Object.fromEntries(
      Object.entries(updatedDev).sort(([left], [right]) => left.localeCompare(right, 'en')),
    );
  }

  await writeFile(
    packageJsonPath,
    jsonFileContentsTransformer({
      value: updatedPackageJson,
    }),
  );
  return true;
};
