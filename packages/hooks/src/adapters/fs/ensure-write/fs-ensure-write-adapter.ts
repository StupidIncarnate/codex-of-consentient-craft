/**
 * PURPOSE: Ensures the parent directory exists before writing, so writing to a path whose
 * directory tree is not there yet (a brand-new project's .claude/) succeeds instead of throwing
 * ENOENT. Reach for this over fsWriteFileAdapter whenever the target's parent directory is not
 * already guaranteed to exist.
 *
 * USAGE:
 * await fsEnsureWriteAdapter({ filepath: filePathContract.parse('/project/.claude/settings.json'), contents: fileContentsContract.parse('{"hooks": {}}') });
 * // Creates /project/.claude if missing, then writes the file
 */

import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsEnsureWriteAdapter = async ({
  filepath,
  contents,
}: {
  filepath: FilePath;
  contents: FileContents;
}): Promise<AdapterResult> => {
  await mkdir(dirname(filepath), { recursive: true });
  await writeFile(filepath, contents, 'utf8');

  return { success: true as const };
};
