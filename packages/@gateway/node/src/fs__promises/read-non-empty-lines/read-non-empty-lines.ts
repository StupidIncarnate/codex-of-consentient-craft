/**
 * PURPOSE: Reads a file and splits it into lines, dropping only lines that are the empty string —
 * a trailing newline's final empty split is dropped, but a truncated last line with content is
 * kept, so a caller reading a growing JSONL file sees a torn last line rather than losing it.
 * Lines come back unparsed; a caller running its own contract parse per line decides what to do
 * with a torn one.
 *
 * USAGE:
 * await readNonEmptyLines('/home/user/.claude/sessions/abc.jsonl');
 * // Returns every non-empty line, in file order; [] for an empty file
 */

import { readFile } from '../read-file/read-file';

export const readNonEmptyLines = async (path: string): Promise<string[]> => {
  const contents = await readFile(path);

  return contents.split('\n').filter((line) => line.length > 0);
};
