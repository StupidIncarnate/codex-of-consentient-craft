import { mkdirSync, type MakeDirectoryOptions } from 'fs';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export type { MakeDirectoryOptions };

export const fsMkdirSync = ({
  dirPath,
  options,
}: {
  dirPath: FilePath;
  options?: MakeDirectoryOptions;
}): void => {
  try {
    mkdirSync(dirPath, options);
  } catch (error) {
    throw new Error(`Failed to create directory at ${dirPath}`, { cause: error });
  }
};
