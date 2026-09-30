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

export const locationsUsageLedgerPathFindBroker = (): string => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = join(homePath, locationsStatics.dungeonmasterHome.usageLedger);

  return joined;
};
