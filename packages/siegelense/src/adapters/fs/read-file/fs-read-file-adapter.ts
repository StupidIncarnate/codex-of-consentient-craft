/**
 * PURPOSE: Reads a file from disk and validates it as FileContents. A registry read routes
 * through here before a caller computes its next write — this adapter never itself changes
 * anything on disk, so it is the one of this trio (alongside fsWriteFileAdapter and
 * fsRenameAdapter) to reach for whenever only today's on-disk state is needed, never a change
 * to it.
 *
 * USAGE:
 * await fsReadFileAdapter({
 *   filePath: AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense/registry.json' }),
 * });
 * // Returns validated FileContents
 */

import { readFile } from 'fs/promises';
import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FileContents } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapter = async ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): Promise<FileContents> => {
  try {
    const content = await readFile(filePath, 'utf8');
    return fileContentsContract.parse(content);
  } catch (error) {
    throw new Error(`Failed to read file at ${filePath}`, { cause: error });
  }
};
