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

import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

export const locationsNodeModulesBinPathFindBroker = ({
  rootPath,
  binName,
}: {
  rootPath: AbsoluteFilePath;
  binName: FileName;
}): AbsoluteFilePath => {
  const joined = pathJoinAdapter({
    paths: [rootPath, locationsStatics.repoRoot.nodeModulesBin, binName],
  });

  return absoluteFilePathContract.parse(joined);
};
