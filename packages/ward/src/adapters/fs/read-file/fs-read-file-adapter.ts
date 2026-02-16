/**
 * PURPOSE: Reads file contents from the filesystem as utf-8 string
 *
 * USAGE:
 * const contents = await fsReadFileAdapter({ filePath: FilePathStub({ value: '/path/to/file.ts' }) });
 * // Returns FileContents branded string
 */

import { readFile } from 'fs/promises';
import {
  fileContentsContract,
  type FileContents,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapter = async ({
  filePath,
}: {
  filePath: FilePath;
}): Promise<FileContents> => {
  const raw = await readFile(filePath, 'utf-8');
  return fileContentsContract.parse(raw);
};
