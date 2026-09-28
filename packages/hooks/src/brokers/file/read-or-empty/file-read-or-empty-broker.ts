/**
 * PURPOSE: Reads file content or returns empty string if file doesn't exist
 *
 * USAGE:
 * const content = await fileReadOrEmptyBroker({ filePath });
 * // Returns file content or empty string on ENOENT
 */
import { readFile } from '#gateway/node/fs__promises';
import { isNodeErrorContract } from '../../../contracts/is-node-error/is-node-error-contract';
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
    const isNodeError = isNodeErrorContract({ error });
    if (isNodeError) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== 'ENOENT') {
        throw error;
      }
    }
    return fileContentsContract.parse('');
  }
};
