/**
 * PURPOSE: Appends contents to a file on disk, creating it if absent. This is the per-step transcript
 * flush — `run_N.jsonl` grows one line at a time as a batch executes, so a driver that dies mid-run
 * leaves every step it already flushed queryable rather than losing the whole run to an unwritten
 * buffer. Reach for this over `fsWriteFileAdapter` whenever the caller is adding to a file's end
 * rather than replacing its contents.
 *
 * USAGE:
 * await fsAppendFileAdapter({
 *   filePath: AbsoluteFilePathStub({ value: '/repo/.siegelense/.../runs/run_2.jsonl' }),
 *   contents: FileContentsStub({ value: '{"step":1,"verb":"goto"}\n' }),
 * });
 * // Appends the contents, then returns { success: true }
 */

import { appendFile } from 'fs/promises';
import type {
  AbsoluteFilePath,
  AdapterResult,
  FileContents,
} from '@dungeonmaster/shared/contracts';

export const fsAppendFileAdapter = async ({
  filePath,
  contents,
}: {
  filePath: AbsoluteFilePath;
  contents: FileContents;
}): Promise<AdapterResult> => {
  await appendFile(filePath, contents, { encoding: 'utf8' });

  return { success: true as const };
};
