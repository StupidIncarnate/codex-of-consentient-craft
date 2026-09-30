/**
 * PURPOSE: Resolves the absolute path to a workspace root's own node_modules directory — reach for
 * this over locationsNodeModulesBinPathFindBroker when the caller needs the directory itself
 * (e.g. to inspect or create a symlink under it) rather than a binary inside its .bin folder.
 *
 * USAGE:
 * locationsNodeModulesPathFindBroker({ rootPath: '/repo' });
 * // Returns AbsoluteFilePath '/repo/node_modules'
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsNodeModulesPathFindBroker = ({ rootPath }: { rootPath: string }): string => {
  const joined = join(rootPath, locationsStatics.repoRoot.nodeModules);

  return joined;
};
