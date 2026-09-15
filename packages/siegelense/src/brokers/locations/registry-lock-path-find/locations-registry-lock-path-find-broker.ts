/**
 * PURPOSE: Resolves the absolute path to this machine's registry lock — the exclusive-create file
 * `registryLockAcquireBroker` stamps and `registryLockReleaseBroker` removes around every
 * `registryUpdateBroker` read-mutate-write, so two unrelated sessions never both compute a next
 * registry value off the same stale snapshot.
 *
 * USAGE:
 * locationsRegistryLockPathFindBroker();
 * // Returns AbsoluteFilePath '<siegelenseRoot>/registry.lock'
 */

import { locationsRootPathFindBroker } from '../root-path-find/locations-root-path-find-broker';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const locationsRegistryLockPathFindBroker = (): AbsoluteFilePath => {
  const rootPath = locationsRootPathFindBroker();

  const joined = pathJoinAdapter({
    paths: [rootPath, locationsStatics.siegelense.registryLock],
  });

  return absoluteFilePathContract.parse(joined);
};
