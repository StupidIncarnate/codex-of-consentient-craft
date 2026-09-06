/**
 * PURPOSE: Resolver the server's image-write broker composes to place a pasted
 * chat image on disk. Reach for this over locationsWardResultsPathFindBroker
 * or locationsDesignScaffoldPathFindBroker when the target is the quest's
 * images subtree, not ward or design output.
 *
 * USAGE:
 * locationsQuestImagesPathFindBroker({ questFolderPath: AbsoluteFilePathStub() });
 * // Returns AbsoluteFilePath '<questFolderPath>/images'
 */

import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
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
  const joined = pathJoinAdapter({
    paths: [questFolderPath, locationsStatics.quest.imagesDir],
  });

  return absoluteFilePathContract.parse(joined);
};
