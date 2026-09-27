/**
 * PURPOSE: Resolves the absolute path to the ward-results directory inside a quest folder
 *
 * USAGE:
 * locationsWardResultsPathFindBroker({ questFolderPath: AbsoluteFilePathStub() });
 * // Returns AbsoluteFilePath '<questFolderPath>/ward-results'
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsWardResultsPathFindBroker = ({
  questFolderPath,
}: {
  questFolderPath: AbsoluteFilePath;
}): AbsoluteFilePath => {
  const joined = join(questFolderPath, locationsStatics.quest.wardResultsDir);

  return absoluteFilePathContract.parse(joined);
};
