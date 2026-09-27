/**
 * PURPOSE: Resolves the absolute path to the dungeonmaster home usage-ledger.json file
 *
 * USAGE:
 * locationsUsageLedgerPathFindBroker();
 * // Returns AbsoluteFilePath '<dmHome>/usage-ledger.json'
 */

import { join } from '#gateway/node/path';
import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsUsageLedgerPathFindBroker = (): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = join(homePath, locationsStatics.dungeonmasterHome.usageLedger);

  return absoluteFilePathContract.parse(joined);
};
