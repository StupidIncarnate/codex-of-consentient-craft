import { existsSync, readFileSync } from 'fs';
import { fileContentsContract } from '@questmaestro/shared/contracts';
import type { FilePath, FileContents } from '@questmaestro/shared/contracts';

/**
 * PURPOSE: Reads a file synchronously and throws an error if the file doesn't exist
 *
 * USAGE:
 * const contents = fsEnsureReadFileSyncAdapter({ filePath: filePathContract.parse('/path/to/file.ts') });
 * // Returns FileContents contract type with validated file contents
 *
 * WHEN-TO-USE: When you need to read a file and want an explicit error if it's missing
 * WHEN-NOT-TO-USE: When missing files should be handled silently - use fsReadFileSyncAdapter instead
 */
export const fsEnsureReadFileSyncAdapter = ({
  filePath,
  encoding,
}: {
  filePath: FilePath;
  encoding?: BufferEncoding;
}): FileContents => {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const contents = readFileSync(filePath, encoding ?? 'utf-8');
  return fileContentsContract.parse(contents);
};
