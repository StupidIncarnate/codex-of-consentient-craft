/**
 * PURPOSE: Reads file content or returns empty string if file doesn't exist
 *
 * USAGE:
 * const content = await fileReadOrEmptyBroker({ filePath });
 * // Returns file content or empty string on ENOENT
 */
import { readFile } from '#gateway/node/fs__promises';
import { isFsError } from '#gateway/node/fs';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fileReadOrEmptyBroker = async ({
  filePath,
}: {
  filePath: FilePath;
}): Promise<FileContents> => {
  try {
    const contents = await readFile(filePath);
    return fileContentsContract.parse(contents);
  } catch (error: unknown) {
    if (!isFsError({ error, code: 'ENOENT' })) {
      throw error;
    }
    return fileContentsContract.parse('');
  }
};
