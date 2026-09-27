/**
 * PURPOSE: Lists a directory's entries with each one's kind, avoiding a second `stat` per entry
 * for a caller that needs to skip non-directories or non-files while walking a tree.
 *
 * USAGE:
 * await readdirEntries('/repo/.dungeonmaster/quests');
 * // Returns [{ name, kind }, ...]; [] for an empty directory; rejects on every failure
 */

import { readdir } from 'fs/promises';
import type { DirEntry } from './dir-entry';

export const readdirEntries = async (path: string): Promise<DirEntry[]> => {
  const entries = await readdir(path, { withFileTypes: true });

  return entries.map((entry) => {
    if (entry.isFile()) {
      return { name: entry.name, kind: 'file' as const };
    }
    if (entry.isDirectory()) {
      return { name: entry.name, kind: 'directory' as const };
    }
    if (entry.isSymbolicLink()) {
      return { name: entry.name, kind: 'symlink' as const };
    }
    return { name: entry.name, kind: 'other' as const };
  });
};
