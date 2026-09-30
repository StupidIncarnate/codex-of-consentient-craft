/**
 * PURPOSE: Resolves the absolute path to a binary inside a workspace's node_modules/.bin directory
 *
 * USAGE:
 * locationsNodeModulesBinPathFindBroker({
 *   rootPath: AbsoluteFilePathStub({ value: '/repo' }),
 *   binName: FileNameStub({ value: 'jest' }),
 * });
 * // Returns AbsoluteFilePath '/repo/node_modules/.bin/jest'
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

export const locationsNodeModulesBinPathFindBroker = ({
  rootPath,
  binName,
}: {
  rootPath: string;
  binName: FileName;
}): string => {
  const joined = join(rootPath, locationsStatics.repoRoot.nodeModulesBin, binName);

  return joined;
};
