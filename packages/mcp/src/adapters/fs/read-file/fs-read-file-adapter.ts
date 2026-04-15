/**
 * PURPOSE: Read file contents from filesystem using fs/promises
 *
 * USAGE:
 * const contents = await fsReadFileAdapter({ filepath: PathSegmentStub({ value: '/path/to/file.ts' }) });
 * // Returns: FileContents('export const foo = ...')
 *
 * CONTRACTS: Input: PathSegment (branded string)
 * CONTRACTS: Output: FileContents (branded string)
 */

import { readFile } from 'fs/promises';
import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { FileContents, PathSegment } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapter = async ({
  filepath,
}: {
  filepath: PathSegment;
}): Promise<FileContents> => {
  const buffer = await readFile(filepath, 'utf8');

  return fileContentsContract.parse(buffer);
};
