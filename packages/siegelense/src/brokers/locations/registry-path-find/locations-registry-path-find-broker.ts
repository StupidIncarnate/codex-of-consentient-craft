/**
 * PURPOSE: Resolves the absolute path to this machine's siegelense instance registry — the one
 * shared disk record every unrelated session driving siegelense on this machine reads and writes
 * to coordinate, since there is no daemon and no master to hold it in memory. One entry per
 * instance: id, owner, quest, pid, pgids, specHash, ports, state, lastBeat.
 *
 * USAGE:
 * locationsRegistryPathFindBroker();
 * // Returns AbsoluteFilePath '<siegelenseRoot>/registry.json'
 */

import { locationsRootPathFindBroker } from '../root-path-find/locations-root-path-find-broker';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const locationsRegistryPathFindBroker = (): AbsoluteFilePath => {
  const rootPath = locationsRootPathFindBroker();

  const joined = pathJoinAdapter({
    paths: [rootPath, locationsStatics.siegelense.registry],
  });

  return absoluteFilePathContract.parse(joined);
};
