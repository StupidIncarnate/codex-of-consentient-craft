/**
 * PURPOSE: Reads a file synchronously and returns validated file contents
 *
 * USAGE:
 * const contents = fsReadFileSyncAdapter({ filePath: filePathContract.parse('/path/to/file.ts') });
 * // Returns FileContents contract type with validated file contents
 *
 * WHEN-NOT-TO-USE: When you need to check if file exists first - use fsEnsureReadFileSyncAdapter instead
 */
import { readFileSync } from 'fs';
import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, FileContents } from '@dungeonmaster/shared/contracts';

export const fsReadFileSyncAdapter = ({
  filePath,
  encoding,
}: {
  filePath: FilePath;
  encoding?: BufferEncoding;
}): FileContents => {
  const contents = readFileSync(filePath, encoding ?? 'utf-8');
  return fileContentsContract.parse(contents);
};
