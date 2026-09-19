/**
 * PURPOSE: Appends newline-terminated JSON lines to a file, creating the parent directory
 * first. Reach for this over `fsAppendFileAdapter` wherever the parent directory may not
 * exist yet — a Claude transcript directory is named by an encoding, never `mkdir`ed ahead of
 * time, and a session or sub-agent route writing its first line always meets a missing
 * directory.
 *
 * USAGE:
 * await dmJsonlAppendAdapter({ filePath, lines: [line1, line2] });
 * // Appends '<line1>\n<line2>\n' to filePath, creating its directory first
 */
import { appendFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  AdapterResult,
  StreamJsonLine,
} from '@dungeonmaster/shared/contracts';

export const dmJsonlAppendAdapter = async ({
  filePath,
  lines,
}: {
  filePath: AbsoluteFilePath;
  lines: readonly StreamJsonLine[];
}): Promise<AdapterResult> => {
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, lines.map((line) => `${line}\n`).join(''));

  return adapterResultContract.parse({ success: true });
};
