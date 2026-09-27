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
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsRateLimitsHistoryPathFindBroker = (): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = join(homePath, locationsStatics.dungeonmasterHome.rateLimitsHistory);

  return absoluteFilePathContract.parse(joined);
};
