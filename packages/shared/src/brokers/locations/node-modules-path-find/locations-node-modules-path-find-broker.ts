/**
 * PURPOSE: Resolves the absolute path to a workspace root's own node_modules directory — reach for
 * this over locationsNodeModulesBinPathFindBroker when the caller needs the directory itself
 * (e.g. to inspect or create a symlink under it) rather than a binary inside its .bin folder.
 *
 * USAGE:
 * locationsNodeModulesPathFindBroker({ rootPath: AbsoluteFilePathStub({ value: '/repo' }) });
 * // Returns AbsoluteFilePath '/repo/node_modules'
 */

import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const locationsNodeModulesPathFindBroker = ({
  rootPath,
}: {
  rootPath: AbsoluteFilePath;
}): AbsoluteFilePath => {
  const joined = pathJoinAdapter({
    paths: [rootPath, locationsStatics.repoRoot.nodeModules],
  });

  return absoluteFilePathContract.parse(joined);
};
