/**
 * PURPOSE: Reads file content or returns empty string if file doesn't exist
 *
 * USAGE:
 * const content = await fileReadOrEmptyBroker({ filePath });
 * // Returns file content or empty string on ENOENT
 */
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { isNodeErrorContract } from '../../../contracts/is-node-error/is-node-error-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fileReadOrEmptyBroker = async ({
  filePath,
}: {
  filePath: FilePath;
}): Promise<FileContents> => {
  try {
    return await fsReadFileAdapter({ filePath: filePathContract.parse(filePath) });
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
