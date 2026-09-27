/**
 * PURPOSE: Resolves the absolute path to the planned-work directory inside a quest folder
 *
 * USAGE:
 * locationsPlannedWorkPathFindBroker({ questFolderPath: AbsoluteFilePathStub() });
 * // Returns AbsoluteFilePath '<questFolderPath>/planned-work'
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsPlannedWorkPathFindBroker = ({
  questFolderPath,
}: {
  questFolderPath: AbsoluteFilePath;
}): AbsoluteFilePath => {
  const joined = join(questFolderPath, locationsStatics.quest.plannedWorkDir);

  return absoluteFilePathContract.parse(joined);
};
