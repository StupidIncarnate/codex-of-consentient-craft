/**
 * PURPOSE: Write file contents to filesystem using fs/promises
 *
 * USAGE:
 * await fsWriteFileAdapter({ filepath: PathSegmentStub({ value: '/path/to/file.json' }), contents: FileContentsStub({ value: '{"data": "value"}' }) });
 * // Writes file to filesystem
 *
 * CONTRACTS: Input: PathSegment (branded string), FileContents (branded string)
 * CONTRACTS: Output: AdapterResult
 */

import { writeFile } from 'fs/promises';
import type { AdapterResult, FileContents, PathSegment } from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapter = async ({
  filepath,
  contents,
}: {
  filepath: PathSegment;
  contents: FileContents;
}): Promise<AdapterResult> => {
  await writeFile(filepath, contents, 'utf8');

  return { success: true as const };
};
