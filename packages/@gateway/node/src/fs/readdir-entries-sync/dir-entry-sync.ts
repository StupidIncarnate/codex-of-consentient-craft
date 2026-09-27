/**
 * PURPOSE: The shape `readdirEntriesSync` works with, declared on its own so a caller names it through
 * `#gateway/node/fs` without importing the function.
 *
 * USAGE:
 * import type { DirEntrySync } from '#gateway/node/fs';
 */

export interface DirEntrySync {
  name: string;
  kind: 'file' | 'directory' | 'symlink' | 'other';
}
