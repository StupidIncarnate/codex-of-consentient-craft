/**
 * PURPOSE: Resolves the absolute path to the dungeonmaster home rate-limits.json snapshot file
 *
 * USAGE:
 * locationsRateLimitsSnapshotPathFindBroker();
 * // Returns AbsoluteFilePath '<dmHome>/rate-limits.json'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsRateLimitsSnapshotPathFindBroker = (): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = pathJoinAdapter({
    paths: [homePath, locationsStatics.dungeonmasterHome.rateLimitsSnapshot],
  });

  return absoluteFilePathContract.parse(joined);
};
