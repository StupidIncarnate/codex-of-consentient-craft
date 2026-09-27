/**
 * PURPOSE: The shape `readdirEntries` works with, declared on its own so a caller names it through
 * `#gateway/node/fs__promises` without importing the function.
 *
 * USAGE:
 * import type { DirEntry } from '#gateway/node/fs__promises';
 */

export interface DirEntry {
  name: string;
  kind: 'file' | 'directory' | 'symlink' | 'other';
}
