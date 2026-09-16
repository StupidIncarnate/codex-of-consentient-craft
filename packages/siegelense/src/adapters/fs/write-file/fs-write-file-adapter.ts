/**
 * PURPOSE: Writes contents to a file on disk. A registry update writes here FIRST, to the
 * `registry.json.tmp` sibling — never straight to the live `registry.json` — because the
 * registry is the one place in this design where a read-modify-write is unavoidable: three
 * unrelated sessions on one machine share it, and a partial write straight to the live file is a
 * registry that parses as half a fleet. This adapter alone does not make that swap atomic;
 * fsRenameAdapter's rename onto the live path is the second half of the pair, and is the one of
 * this trio to reach for once these bytes already sit at their tmp path.
 *
 * `exclusive: true` swaps the write's flag from `'w'` (create-or-overwrite) to `'wx'`
 * (create-or-fail): the OS performs the existence check and the create as ONE operation, so this
 * is the only primitive `bootLockAcquireBroker` can build an actual lock out of — a separate read
 * to check absence followed by a separate write leaves a gap two processes can both pass through.
 * Default omitted or `false` keeps the existing overwrite behaviour `registryWriteBroker` depends
 * on.
 *
 * USAGE:
 * await fsWriteFileAdapter({
 *   filePath: AbsoluteFilePathStub({
 *     value: '/home/user/.dungeonmaster/siegelense/registry.json.tmp',
 *   }),
 *   contents: FileContentsStub({ value: '{"instances":[]}' }),
 * });
 * // Writes the file, then returns { success: true }
 *
 * await fsWriteFileAdapter({ filePath, contents, exclusive: true });
 * // Creates the file only when absent; rejects with an EEXIST-coded error otherwise
 */

import { writeFile } from 'fs/promises';
import type {
  AbsoluteFilePath,
  AdapterResult,
  FileContents,
} from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapter = async ({
  filePath,
  contents,
  exclusive,
}: {
  filePath: AbsoluteFilePath;
  contents: FileContents;
  exclusive?: boolean;
}): Promise<AdapterResult> => {
  await writeFile(filePath, contents, { encoding: 'utf8', flag: exclusive === true ? 'wx' : 'w' });

  return { success: true as const };
};
