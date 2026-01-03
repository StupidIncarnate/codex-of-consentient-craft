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
import type { FilePath, FileContents } from '@dungeonmaster/shared/contracts';

export const fsWriteFileSyncAdapter = ({
  filePath,
  contents,
  encoding,
}: {
  filePath: FilePath;
  contents: FileContents;
  encoding?: BufferEncoding;
}): void => {
  writeFileSync(filePath, contents, encoding ?? 'utf-8');
};
