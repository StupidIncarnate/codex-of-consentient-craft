import { rmSync, type RmOptions } from 'fs';
import type { FilePath } from '../../contracts/file-path/file-path-contract';

export type { RmOptions };

export const fsRmSync = ({
  filePath,
  options,
}: {
  filePath: FilePath;
  options?: RmOptions;
}): void => {
  try {
    rmSync(filePath, options);
  } catch (error) {
    throw new Error(`Failed to remove file/directory at ${filePath}`, { cause: error });
  }
};
