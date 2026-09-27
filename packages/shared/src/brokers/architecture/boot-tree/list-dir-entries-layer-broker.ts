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

import { readdirEntriesSync, type DirEntrySync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const listDirEntriesLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): DirEntrySync[] => {
  try {
    return readdirEntriesSync(dirPath);
  } catch {
    return [];
  }
};
