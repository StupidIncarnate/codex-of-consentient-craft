/**
 * PURPOSE: Reads a file from the filesystem and returns its content as validated source code.
 *
 * USAGE:
 * const sourceCode = await fsReadFileAdapter({ filePath: '/path/to/file.ts' });
 * // Returns: SourceCode (branded string with file contents)
 */
import { readFile } from 'fs/promises';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { SourceCode } from '../../../contracts/source-code/source-code-contract';
import { sourceCodeContract } from '../../../contracts/source-code/source-code-contract';

export const fsReadFileAdapter = async ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): Promise<SourceCode> => {
  const content = await readFile(filePath, 'utf8');
  return sourceCodeContract.parse(content);
};
