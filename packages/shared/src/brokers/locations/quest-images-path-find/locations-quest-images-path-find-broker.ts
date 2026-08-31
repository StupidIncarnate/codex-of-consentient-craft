/**
 * PURPOSE: Images pasted into a chat message live in their own directory, a sibling
 * of ward-results/ and design/ (see locationsWardResultsPathFindBroker,
 * locationsDesignScaffoldPathFindBroker), so they share the quest's lifetime and are
 * deleted with it rather than needing separate cleanup. Reach for this broker to
 * compose that path; creating the directory itself is the caller's job.
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
