/**
 * PURPOSE: Resolves the absolute path to the planned-work directory inside a quest folder
 *
 * USAGE:
 * locationsPlannedWorkPathFindBroker({ questFolderPath: '/home/user/project/src/file.ts' });
 * // Returns AbsoluteFilePath '<questFolderPath>/planned-work'
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsPlannedWorkPathFindBroker = ({
  questFolderPath,
}: {
  questFolderPath: string;
}): string => {
  const joined = join(questFolderPath, locationsStatics.quest.plannedWorkDir);

  return joined;
};
