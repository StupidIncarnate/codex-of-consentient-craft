/**
 * PURPOSE: Resolves the absolute path to this machine's siegelense boot lock — held for the
 * duration of one boot and released by staleness, since it is what makes "one boot at a time"
 * enforceable between processes that cannot see each other and share no memory.
 *
 * USAGE:
 * locationsBootLockPathFindBroker();
 * // Returns AbsoluteFilePath '<siegelenseRoot>/boot.lock'
 */

import { locationsRootPathFindBroker } from '../root-path-find/locations-root-path-find-broker';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const locationsBootLockPathFindBroker = (): AbsoluteFilePath => {
  const rootPath = locationsRootPathFindBroker();

  const joined = pathJoinAdapter({
    paths: [rootPath, locationsStatics.siegelense.bootLock],
  });

  return absoluteFilePathContract.parse(joined);
};
