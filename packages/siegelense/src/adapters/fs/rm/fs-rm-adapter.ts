/**
 * PURPOSE: Removes a directory and everything under it. `kill` reaches for this on the THROWAWAY HOME
 * only, never on the evidence directory — "`kill` removes the throwaway home and never the evidence
 * directory" (packages/siegelense/CLAUDE.md), since logs, captures and the transcript are evidence
 * and outlive the instance. `recursive` + `force` means a directory that is already gone, or one with
 * files still inside it, both succeed rather than throwing ENOENT/ENOTEMPTY.
 *
 * USAGE:
 * await fsRmAdapter({
 *   dirPath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' }),
 * });
 * // Removes the directory tree, then returns { success: true }
 */

import { rm } from 'fs/promises';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsRmAdapter = async ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  await rm(dirPath, { recursive: true, force: true });

  return { success: true as const };
};
