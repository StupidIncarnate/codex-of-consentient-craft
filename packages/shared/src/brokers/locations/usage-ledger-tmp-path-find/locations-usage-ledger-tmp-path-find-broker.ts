/**
 * PURPOSE: Resolves the absolute path to the usage-ledger.json.tmp staging file used for atomic
 *   rename writes. Reach for this over the ledger path itself whenever WRITING: the ledger is
 *   rewritten on every scan and read by a separate poll, so a partial write would be parsed as a
 *   corrupt ledger and reset the whole week's measurement.
 *
 * USAGE:
 * locationsUsageLedgerTmpPathFindBroker();
 * // Returns AbsoluteFilePath '<dmHome>/usage-ledger.json.tmp'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsUsageLedgerTmpPathFindBroker = (): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = pathJoinAdapter({
    paths: [homePath, locationsStatics.dungeonmasterHome.usageLedgerTmp],
  });

  return absoluteFilePathContract.parse(joined);
};
