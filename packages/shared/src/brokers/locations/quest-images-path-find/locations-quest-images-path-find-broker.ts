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

export const locationsQuestImagesPathFindBroker = ({
  questFolderPath,
}: {
  questFolderPath: string;
}): string => {
  const joined = join(questFolderPath, locationsStatics.quest.imagesDir);

  return joined;
};
