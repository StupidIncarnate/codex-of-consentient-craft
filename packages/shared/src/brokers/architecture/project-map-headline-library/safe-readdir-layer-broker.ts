/**
 * PURPOSE: Safely reads directory entries, returning empty array on error instead of throwing
 *
 * USAGE:
 * const entries = safeReaddirLayerBroker({ dirPath: absoluteFilePathContract.parse('/repo/packages/shared/src') });
 * // Returns Dirent[] or empty array if directory does not exist
 *
 * WHEN-TO-USE: When scanning library barrel directories and non-existent directories should be silently skipped
 */

import { fsReaddirWithTypesAdapter } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const safeReaddirLayerBroker = ({
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
