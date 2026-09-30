/**
 * PURPOSE: Resolves the absolute path to a binary inside a workspace's node_modules/.bin directory
 *
 * USAGE:
 * locationsNodeModulesBinPathFindBroker({
 *   rootPath: '/repo',
 *   binName: FileNameStub({ value: 'jest' }),
 * });
 * // Returns AbsoluteFilePath '/repo/node_modules/.bin/jest'
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsNodeModulesBinPathFindBroker = ({
  rootPath,
  binName,
}: {
  rootPath: string;
  binName: string;
}): string => {
  const joined = join(rootPath, locationsStatics.repoRoot.nodeModulesBin, binName);

  return joined;
};
