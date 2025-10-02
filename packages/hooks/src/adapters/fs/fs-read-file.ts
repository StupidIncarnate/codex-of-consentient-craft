import { readFile } from 'fs/promises';
import { fileContentsContract } from '../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../contracts/file-contents/file-contents-contract';

export const fsReadFile = async ({ filePath }: { filePath: FilePath }): Promise<FileContents> => {
  try {
    const content = await readFile(filePath, 'utf8');
    return fileContentsContract.parse(content);
  } catch (error) {
    throw new Error(`Failed to read file at ${filePath}`, { cause: error });
  }
};
