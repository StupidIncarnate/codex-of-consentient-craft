/**
 * PURPOSE: Reads directory entries safely, returning an empty array when the directory
 * does not exist. Lets orphan-detect layer brokers iterate optional folder types without
 * branching on try/catch.
 *
 * USAGE:
 * const entries = safeReaddirLayerBroker({ dirPath });
 * // Returns DirEntrySync[] or [] on any read failure
 *
 * WHEN-TO-USE: Inside the orphan-detect domain whenever a missing directory is a normal
 * outcome (folder type absent for a particular package, etc.).
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
