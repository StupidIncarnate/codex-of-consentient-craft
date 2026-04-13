/**
 * PURPOSE: Writes file contents synchronously to disk
 *
 * USAGE:
 * fsWriteFileSyncAdapter({
 *   filePath: filePathContract.parse('/path/to/file.ts'),
 *   contents: fileContentsContract.parse('file contents')
 * });
 * // Writes contents to file synchronously
 */

import { writeFileSync } from 'fs';
import type { AdapterResult, FilePath, FileContents } from '@dungeonmaster/shared/contracts';

export const fsWriteFileSyncAdapter = ({
  filePath,
  contents,
  encoding,
}: {
  filePath: FilePath;
  contents: FileContents;
  encoding?: BufferEncoding;
}): AdapterResult => {
  writeFileSync(filePath, contents, encoding ?? 'utf-8');

  return { success: true as const };
};
