/**
 * PURPOSE: Resolves the absolute path to the dungeonmaster home event-outbox.jsonl file
 *
 * USAGE:
 * locationsOutboxPathFindBroker();
 * // Returns AbsoluteFilePath '<dmHome>/event-outbox.jsonl'
 */

import { dungeonmasterHomeFindBroker } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsOutboxPathFindBroker = (): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = pathJoinAdapter({
    paths: [homePath, locationsStatics.dungeonmasterHome.eventOutbox],
  });

  return absoluteFilePathContract.parse(joined);
};
