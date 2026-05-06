/**
 * PURPOSE: Resolves the absolute path to the rate-limits.json.tmp staging file used for atomic rename writes
 *
 * USAGE:
 * locationsRateLimitsSnapshotTmpPathFindBroker();
 * // Returns AbsoluteFilePath '<dmHome>/rate-limits.json.tmp'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsRateLimitsSnapshotTmpPathFindBroker = (): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = pathJoinAdapter({
    paths: [homePath, locationsStatics.dungeonmasterHome.rateLimitsSnapshotTmp],
  });

  return absoluteFilePathContract.parse(joined);
};
