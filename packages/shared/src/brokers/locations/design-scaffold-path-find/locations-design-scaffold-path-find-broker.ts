/**
 * PURPOSE: Resolves the absolute path to the design directory inside a quest folder
 *
 * USAGE:
 * locationsDesignScaffoldPathFindBroker({ questFolderPath: AbsoluteFilePathStub() });
 * // Returns AbsoluteFilePath '<questFolderPath>/design'
 */

import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsDesignScaffoldPathFindBroker = ({
  questFolderPath,
}: {
  questFolderPath: AbsoluteFilePath;
}): AbsoluteFilePath => {
  const joined = pathJoinAdapter({
    paths: [questFolderPath, locationsStatics.quest.designDir],
  });

  return absoluteFilePathContract.parse(joined);
};
