/**
 * PURPOSE: Records in the consumer's `packages/@gateway/npm/package.json` `dependencies` every
 * package the sync just wrote a folder for, at the range the consumer declared it with — ward's
 * duplicate-install check reads that list, and a wrapper whose package the gateway does not declare
 * resolves only by accident of hoisting. A name already listed keeps its range untouched, and the
 * file is rewritten only when something was added — with `dependencies` sorted by name, as npm keeps
 * it.
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
  const { fileName, recordKey } = gatewayNpmSyncStatics.packageJson;
  const packageJsonPath = join(npmPackageRoot, fileName);
  const packageJson = packageJsonRawContract.parse(JSON.parse(await readFile(packageJsonPath)));
  const recorded = dependencyMapContract.parse(packageJson[recordKey] ?? {});

  const additions = dependencies.filter(({ name }) => !Object.hasOwn(recorded, name));
  if (additions.length === 0) {
    return false;
  }

  await writeFile(
    packageJsonPath,
    jsonFileContentsTransformer({
      value: {
        ...packageJson,
        // Sorted by name, the order npm itself keeps `dependencies` in, so the next `npm install`
        // does not rewrite the file a second time.
        [recordKey]: Object.fromEntries(
          [
            ...Object.entries(recorded),
            ...additions.map(({ name, range }) => [name, range] as const),
          ].sort(([left], [right]) => left.localeCompare(right, 'en')),
        ),
      },
    }),
  );
  return true;
};
