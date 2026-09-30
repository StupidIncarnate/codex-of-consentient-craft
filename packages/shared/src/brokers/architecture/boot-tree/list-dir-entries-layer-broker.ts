/**
 * PURPOSE: Lists directory entries safely, returning empty array when the directory does not exist
 *
 * USAGE:
 * const entries = listDirEntriesLayerBroker({ dirPath: '/project/src/startup' });
 * // Returns Dirent[] or [] if directory is missing
 *
 * WHEN-TO-USE: Boot-tree broker scanning startup/, flows/, responders/, and adapters/ directories
 * where a missing directory should be silently skipped rather than throwing
 */

import { readdirEntriesSync, type DirEntrySync } from '#gateway/node/fs';

export const listDirEntriesLayerBroker = ({ dirPath }: { dirPath: string }): DirEntrySync[] => {
  try {
    return readdirEntriesSync(dirPath);
  } catch {
    return [];
  }
};
