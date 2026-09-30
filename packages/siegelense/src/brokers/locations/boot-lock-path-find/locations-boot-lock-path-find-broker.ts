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
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';

export const locationsBootLockPathFindBroker = (): string => {
  const rootPath = locationsRootPathFindBroker();

  const joined = join(rootPath, locationsStatics.siegelense.bootLock);

  return joined;
};
