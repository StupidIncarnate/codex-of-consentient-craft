import { writeFileSync, type WriteFileOptions } from 'fs';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../contracts/file-contents/file-contents-contract';

export type { WriteFileOptions };

export const fsWriteFileSync = ({
  filePath,
  content,
  options,
}: {
  filePath: FilePath;
  content: FileContents;
  options?: WriteFileOptions;
}): void => {
  try {
    writeFileSync(filePath, content, options);
  } catch (error) {
    throw new Error(`Failed to write file at ${filePath}`, { cause: error });
  }
};
