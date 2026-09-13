/**
 * PURPOSE: Resolves the absolute path to the dungeonmaster home usage-ledger.json file
 *
 * USAGE:
 * locationsUsageLedgerPathFindBroker();
 * // Returns AbsoluteFilePath '<dmHome>/usage-ledger.json'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsUsageLedgerPathFindBroker = (): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = pathJoinAdapter({
    paths: [homePath, locationsStatics.dungeonmasterHome.usageLedger],
  });

  return absoluteFilePathContract.parse(joined);
};
