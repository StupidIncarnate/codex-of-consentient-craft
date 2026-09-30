/**
 * PURPOSE: Resolves the absolute path to the dungeonmaster home rate-limits.json snapshot file
 *
 * USAGE:
 * locationsRateLimitsSnapshotPathFindBroker();
 * // Returns AbsoluteFilePath '<dmHome>/rate-limits.json'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsRateLimitsSnapshotPathFindBroker = (): string => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = join(homePath, locationsStatics.dungeonmasterHome.rateLimitsSnapshot);

  return joined;
};
