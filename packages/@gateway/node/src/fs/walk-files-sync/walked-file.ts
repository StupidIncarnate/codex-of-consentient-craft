/**
 * PURPOSE: The shape `walkFilesSync` works with, declared on its own so a caller names it through
 * `#gateway/node/fs` without importing the function.
 *
 * USAGE:
 * import type { WalkedFile } from '#gateway/node/fs';
 */

export interface WalkedFile {
  path: string;
  sizeBytes: number;
  modifiedAtMs: number;
}
