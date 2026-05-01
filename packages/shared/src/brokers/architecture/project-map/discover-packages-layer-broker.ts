/**
 * PURPOSE: Safely lists entries in the monorepo's packages/ directory, returning empty array when the directory is missing (single-root project mode)
 *
 * USAGE:
 * const entries = discoverPackagesLayerBroker({ dirPath: absoluteFilePathContract.parse('/repo/packages') });
 * // Returns Dirent[] of package directories, or [] when no packages/ folder exists
 *
 * WHEN-TO-USE: When the project-map composer needs to detect monorepo vs single-root layout without throwing on a missing packages/ directory
 */

import { fsReaddirWithTypesAdapter } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const discoverPackagesLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): ReturnType<typeof fsReaddirWithTypesAdapter> => {
  try {
    return fsReaddirWithTypesAdapter({ dirPath });
  } catch {
    return [];
  }
};
