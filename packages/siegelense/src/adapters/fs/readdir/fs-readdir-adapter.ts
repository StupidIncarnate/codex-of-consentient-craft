/**
 * PURPOSE: Lists a directory's file names, answering an empty list for a directory that does not
 * exist (ENOENT) rather than throwing — a status/guild-listing read routes through here before any
 * directory is guaranteed to have been created yet. Any other failure (EACCES, ENOTDIR, a bad
 * handle) is a real problem with the read, not an absent directory, and propagates unchanged: a
 * broad catch that answers `[]` for a permission error is how a status call reports an empty
 * machine. `isNativeError` (not `errorIsNativeErrorAdapter`) does the cross-realm check directly —
 * an adapter may not import another adapter, so this mirrors what that one wraps rather than
 * importing it.
 *
 * USAGE:
 * await fsReaddirAdapter({ dirPath: AbsoluteFilePathStub({ value: '/repo/.siegelense/guilds' }) });
 * // Returns every file name directly under dirPath, or [] if dirPath does not exist
 */

import { readdir } from 'fs/promises';
import { isNativeError } from 'util/types';
import { fileNameContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FileName } from '@dungeonmaster/shared/contracts';

export const fsReaddirAdapter = async ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): Promise<readonly FileName[]> => {
  try {
    const entries = await readdir(dirPath);
    return entries.map((entryName) => fileNameContract.parse(entryName));
  } catch (error) {
    if (
      error !== null &&
      typeof error === 'object' &&
      isNativeError(error) &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return [];
    }
    throw error;
  }
};
