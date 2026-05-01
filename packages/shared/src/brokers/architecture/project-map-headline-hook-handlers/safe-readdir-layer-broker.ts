/**
 * PURPOSE: Safely reads directory entries, returning empty array on error instead of throwing.
 *
 * USAGE:
 * const entries = safeReaddirLayerBroker({ dirPath: absoluteFilePathContract.parse('/project/src/startup') });
 * // Returns Dirent[] or empty array if directory does not exist
 *
 * WHEN-TO-USE: hook-handlers headline broker reading startup and responder directories
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { fsReaddirWithTypesAdapter } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter';

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
