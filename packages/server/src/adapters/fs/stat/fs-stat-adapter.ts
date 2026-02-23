/**
 * PURPOSE: Wraps fs.stat to retrieve file metadata (modification time, birth time, size)
 *
 * USAGE:
 * const stats = await fsStatAdapter({ filePath: FilePathStub({ value: '/path/to/file.jsonl' }) });
 * // Returns Stats object with birthtime, mtimeMs, etc.
 */

import { stat } from 'fs/promises';
import type { Stats } from 'fs';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsStatAdapter = async ({ filePath }: { filePath: FilePath }): Promise<Stats> =>
  stat(filePath);
