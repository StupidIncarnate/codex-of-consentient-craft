/**
 * PURPOSE: Creates a file's parent directory and writes the file, for the recipes whose state has
 * no app endpoint behind it — `fidelity: direct` means "written straight to disk in the shape
 * production WOULD have made" (siegelense-recipes.md line 434), and every one of those writes
 * lands somewhere that does not exist yet. Reach for this over a bare `writeFile`: a `direct`
 * recipe's whole point is that it reproduces a path the app computes, and a missing intermediate
 * directory is the most common way that reproduction fails.
 *
 * USAGE:
 * await fsWriteTextAdapter({
 *   filePath: '/tmp/dm-siege-x/.claude/projects/-tmp-repo/sess-1.jsonl',
 *   contents: '{"type":"user"}\n',
 * });
 * // Creates every missing parent directory, writes the file, returns { success: true }
 */

import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  AdapterResult,
  FileContents,
} from '@dungeonmaster/shared/contracts';

export const fsWriteTextAdapter = async ({
  filePath,
  contents,
}: {
  filePath: AbsoluteFilePath;
  contents: FileContents;
}): Promise<AdapterResult> => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
  return adapterResultContract.parse({ success: true });
};
