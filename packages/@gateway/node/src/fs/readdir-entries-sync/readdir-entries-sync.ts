/**
 * PURPOSE: Lists a directory's entries with each one's kind, avoiding a second `statSync` per
 * entry for a caller walking a tree that needs to skip non-directories or non-files.
 *
 * USAGE:
 * const entries = readdirEntriesSync('/tmp/adir');
 * // Returns [{ name, kind }, ...]; [] for an empty directory; throws the raw error otherwise
 */
import { readdirSync } from 'fs';
import type { DirEntrySync } from './dir-entry-sync';

export const readdirEntriesSync = (path: string): DirEntrySync[] => {
  const entries = readdirSync(path, { withFileTypes: true });

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
