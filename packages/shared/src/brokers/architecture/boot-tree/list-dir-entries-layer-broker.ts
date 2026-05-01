/**
 * PURPOSE: Lists directory entries safely, returning empty array when the directory does not exist
 *
 * USAGE:
 * const entries = listDirEntriesLayerBroker({ dirPath: absoluteFilePathContract.parse('/project/src/startup') });
 * // Returns Dirent[] or [] if directory is missing
 *
 * WHEN-TO-USE: Boot-tree broker scanning startup/, flows/, responders/, and adapters/ directories
 * where a missing directory should be silently skipped rather than throwing
 */

import { fsReaddirWithTypesAdapter } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const listDirEntriesLayerBroker = ({
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
