/**
 * PURPOSE: Resolves the absolute path to the dungeonmaster home dispatch-state.json file
 *
 * USAGE:
 * locationsDispatchStatePathFindBroker();
 * // Returns AbsoluteFilePath '<dmHome>/dispatch-state.json'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsDispatchStatePathFindBroker = (): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = pathJoinAdapter({
    paths: [homePath, locationsStatics.dungeonmasterHome.dispatchState],
  });

  return absoluteFilePathContract.parse(joined);
};
