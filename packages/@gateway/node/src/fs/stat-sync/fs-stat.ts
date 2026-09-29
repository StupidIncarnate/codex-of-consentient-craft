/**
 * PURPOSE: The shape `statSync` works with, declared on its own so a caller names it through
 * `#gateway/node/fs` without importing the function.
 *
 * USAGE:
 * import type { FsStat } from '#gateway/node/fs';
 */

export interface FsStat {
  kind: 'file' | 'directory' | 'symlink' | 'other';
  sizeBytes: number;
  modifiedAtMs: number;
  inode: number;
}
