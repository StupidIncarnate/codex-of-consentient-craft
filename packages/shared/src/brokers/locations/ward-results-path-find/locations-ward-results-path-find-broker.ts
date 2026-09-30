/**
 * PURPOSE: Resolves the absolute path to the ward-results directory inside a quest folder
 *
 * USAGE:
 * locationsWardResultsPathFindBroker({ questFolderPath: '/home/user/project/src/file.ts' });
 * // Returns AbsoluteFilePath '<questFolderPath>/ward-results'
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsWardResultsPathFindBroker = ({
  questFolderPath,
}: {
  questFolderPath: string;
}): string => {
  const joined = join(questFolderPath, locationsStatics.quest.wardResultsDir);

  return joined;
};
