/**
 * PURPOSE: Safely reads directory entries, returning empty array on error instead of throwing
 *
 * USAGE:
 * const entries = safeReaddirLayerBroker({ dirPath: absoluteFilePathContract.parse('/project/src/widgets') });
 * // Returns DirEntrySync[] or empty array if directory does not exist
 *
 * WHEN-TO-USE: Widget-tree broker scanning widget directories where a missing directory should
 * be silently skipped rather than throwing
 */

import { readdirEntriesSync, type DirEntrySync } from '#gateway/node/fs';

export const safeReaddirLayerBroker = ({
  dirPath,
}: {
  dirPath: string;
}): DirEntrySync[] => {
  try {
    return readdirEntriesSync(dirPath);
  } catch {
    return [];
  }
};
