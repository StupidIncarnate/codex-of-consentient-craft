/**
 * PURPOSE: Safely reads directory entries, returning empty array on error instead of throwing
 *
 * USAGE:
 * const entries = safeReaddirLayerBroker({ dirPath: absoluteFilePathContract.parse('/project/src') });
 * // Returns DirEntrySync[] or empty array if directory does not exist
 *
 * WHEN-TO-USE: When scanning source trees where non-existent directories should be skipped
 */

import { readdirEntriesSync, type DirEntrySync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const safeReaddirLayerBroker = ({
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
