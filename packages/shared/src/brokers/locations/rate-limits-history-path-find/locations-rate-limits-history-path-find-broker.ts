/**
 * PURPOSE: Resolves the absolute path to the rate-limits-history.jsonl append-only log file
 *
 * USAGE:
 * locationsRateLimitsHistoryPathFindBroker();
 * // Returns AbsoluteFilePath '<dmHome>/rate-limits-history.jsonl'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsRateLimitsHistoryPathFindBroker = (): string => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = join(homePath, locationsStatics.dungeonmasterHome.rateLimitsHistory);

  return joined;
};
