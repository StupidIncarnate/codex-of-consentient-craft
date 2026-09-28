/**
 * PURPOSE: The shape `stat` works with, declared on its own so a caller names it through
 * `#gateway/node/fs__promises` without importing the function.
 *
 * USAGE:
 * import type { FileStat } from '#gateway/node/fs__promises';
 */

export interface FileStat {
  kind: 'file' | 'directory' | 'symlink' | 'other';
  sizeBytes: number;
  modifiedAtMs: number;
  createdAtMs: number;
}
