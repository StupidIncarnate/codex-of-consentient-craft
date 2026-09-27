/**
 * PURPOSE: Resolves the absolute path to the dungeonmaster home dispatch-state.json.tmp file (atomic-write staging)
 *
 * USAGE:
 * locationsDispatchStateTmpPathFindBroker();
 * // Returns AbsoluteFilePath '<dmHome>/dispatch-state.json.tmp'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsDispatchStateTmpPathFindBroker = (): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = join(homePath, locationsStatics.dungeonmasterHome.dispatchStateTmp);

  return absoluteFilePathContract.parse(joined);
};
