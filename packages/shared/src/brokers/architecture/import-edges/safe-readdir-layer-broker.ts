/**
 * PURPOSE: Safely reads directory entries, returning empty array on error instead of throwing
 *
 * USAGE:
 * const entries = safeReaddirLayerBroker({ dirPath: absoluteFilePathContract.parse('/repo/packages') });
 * // Returns DirEntrySync[] or empty array if directory does not exist
 *
 * WHEN-TO-USE: When scanning package directories and non-existent directories should be silently skipped
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
