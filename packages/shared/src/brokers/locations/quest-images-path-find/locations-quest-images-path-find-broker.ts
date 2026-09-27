/**
 * PURPOSE: Resolver the server's image-write broker composes to place a pasted
 * chat image on disk. Reach for this over locationsWardResultsPathFindBroker
 * when the target is the quest's images subtree, not ward output.
 *
 * USAGE:
 * locationsQuestImagesPathFindBroker({ questFolderPath: AbsoluteFilePathStub() });
 * // Returns AbsoluteFilePath '<questFolderPath>/images'
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsQuestImagesPathFindBroker = ({
  questFolderPath,
}: {
  questFolderPath: AbsoluteFilePath;
}): AbsoluteFilePath => {
  const joined = join(questFolderPath, locationsStatics.quest.imagesDir);

  return absoluteFilePathContract.parse(joined);
};
