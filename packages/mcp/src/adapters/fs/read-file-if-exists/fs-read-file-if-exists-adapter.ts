/**
 * PURPOSE: Reads a file whose absence is an ordinary answer rather than a fault — the repo
 * .gitignore discover folds into its ignore list, which a project installed into may simply not
 * keep. Reach for fsReadFileAdapter instead wherever a missing file means the caller is broken and
 * the read should surface that.
 *
 * USAGE:
 * const contents = await fsReadFileIfExistsAdapter({
 *   filepath: PathSegmentStub({ value: '/repo/.gitignore' }),
 * });
 * // Returns FileContents when the file is readable, undefined when it is not
 */

import { readFile } from 'fs/promises';
import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { FileContents, PathSegment } from '@dungeonmaster/shared/contracts';

export const fsReadFileIfExistsAdapter = async ({
  filepath,
}: {
  filepath: PathSegment;
}): Promise<FileContents | undefined> => {
  try {
    const buffer = await readFile(filepath, 'utf8');
    return fileContentsContract.parse(buffer);
  } catch {
    return undefined;
  }
};
