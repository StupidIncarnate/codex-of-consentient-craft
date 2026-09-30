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

export const locationsDispatchStateTmpPathFindBroker = (): string => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = join(homePath, locationsStatics.dungeonmasterHome.dispatchStateTmp);

  return joined;
};
