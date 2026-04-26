/**
 * PURPOSE: Resolves the absolute path to the ward-results directory inside a quest folder
 *
 * USAGE:
 * locationsWardResultsPathFindBroker({ questFolderPath: AbsoluteFilePathStub() });
 * // Returns AbsoluteFilePath '<questFolderPath>/ward-results'
 */

import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
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
  const joined = pathJoinAdapter({
    paths: [questFolderPath, locationsStatics.quest.wardResultsDir],
  });

  return absoluteFilePathContract.parse(joined);
};
