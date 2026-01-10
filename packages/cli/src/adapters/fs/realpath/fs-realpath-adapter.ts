/**
 * PURPOSE: Resolves a file path to its real path, following symlinks
 *
 * USAGE:
 * fsRealpathAdapter({filePath: absoluteFilePathContract.parse('/path/to/symlink')});
 * // Returns the resolved absolute path, or the original path if resolution fails
 */

import { realpathSync } from 'node:fs';

import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsRealpathAdapter = ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): AbsoluteFilePath => {
  try {
    const resolved = realpathSync(filePath);
    return absoluteFilePathContract.parse(resolved);
  } catch {
    // Return original path if resolution fails (e.g., file doesn't exist)
    return filePath;
  }
};
