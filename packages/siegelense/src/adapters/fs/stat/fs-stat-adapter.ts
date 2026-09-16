/**
 * PURPOSE: Reads one file's size and modification time from disk, answering `null` for a file that
 * does not exist (ENOENT) rather than throwing — a status/evidence read routes through here before
 * deciding whether a shot or a log file is even there. Any other failure (EACCES, ENOTDIR, a bad
 * handle) is a real problem with the read, not an absent file, and propagates unchanged. `mtimeMs`
 * is floored before parsing: `EpochMs` demands an integer and `fs.Stats.mtimeMs` carries sub-
 * millisecond precision.
 *
 * USAGE:
 * await fsStatAdapter({ filePath: AbsoluteFilePathStub({ value: '/repo/.siegelense/run_2/step7.png' }) });
 * // Returns { sizeBytes, modifiedAtMs }, or null if the file does not exist
 */

import { stat } from 'fs/promises';
import { isNativeError } from 'util/types';
import { fileStatContract } from '../../../contracts/file-stat/file-stat-contract';
import type { FileStat } from '../../../contracts/file-stat/file-stat-contract';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsStatAdapter = async ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): Promise<FileStat | null> => {
  try {
    const stats = await stat(filePath);
    return fileStatContract.parse({
      sizeBytes: stats.size,
      modifiedAtMs: Math.floor(stats.mtimeMs),
    });
  } catch (error) {
    if (
      error !== null &&
      typeof error === 'object' &&
      isNativeError(error) &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  }
};
