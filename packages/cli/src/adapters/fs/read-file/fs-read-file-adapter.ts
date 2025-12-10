/**
 * PURPOSE: Reads file contents from filesystem and validates as FileContents contract
 *
 * USAGE:
 * await fsReadFileAdapter({filePath: FilePathStub({ value: '/quest.json' })});
 * // Returns validated FileContents
 */

import { readFile } from 'fs/promises';
import { fileContentsContract, type FileContents } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapter = async ({
  filePath,
}: {
  filePath: FilePath;
}): Promise<FileContents> => {
  try {
    const content = await readFile(filePath, 'utf8');
    return fileContentsContract.parse(content);
  } catch (error) {
    throw new Error(`Failed to read file at ${filePath}`, { cause: error });
  }
};
