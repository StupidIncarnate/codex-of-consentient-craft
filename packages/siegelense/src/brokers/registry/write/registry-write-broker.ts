/**
 * PURPOSE: Persists the whole siegelense registry to `<siegelenseRoot>/registry.json.tmp`, then
 * renames it over the live `registry.json`. The rename is the whole point: three unrelated
 * sessions on one machine share this file, a rename within one filesystem is atomic, and a
 * partial write straight to the live path is a registry that parses as half a fleet. `mkdir -p`s
 * the siegelense root first, since a fresh machine may not have created it yet.
 *
 * USAGE:
 * await registryWriteBroker({ registry: RegistryStub() });
 * // Writes registry.json.tmp, renames it over registry.json, returns { success: true }
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  fileContentsContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import type { Registry } from '../../../contracts/registry/registry-contract';
import { locationsRegistryPathFindBroker } from '../../locations/registry-path-find/locations-registry-path-find-broker';
import { locationsRootPathFindBroker } from '../../locations/root-path-find/locations-root-path-find-broker';

export const registryWriteBroker = async ({
  registry,
}: {
  registry: Registry;
}): Promise<AdapterResult> => {
  const rootPath = locationsRootPathFindBroker();
  const registryPath = locationsRegistryPathFindBroker();
  const tmpPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [rootPath, locationsStatics.siegelense.registryTmp] }),
  );

  await fsMkdirAdapter({ filepath: filePathContract.parse(rootPath) });

  const contents = fileContentsContract.parse(`${JSON.stringify(registry)}\n`);
  await fsWriteFileAdapter({ filePath: tmpPath, contents });

  return fsRenameAdapter({ fromPath: tmpPath, toPath: registryPath });
};
