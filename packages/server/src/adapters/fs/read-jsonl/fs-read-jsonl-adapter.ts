/**
 * PURPOSE: Reads a JSONL file and parses each non-empty line as JSON, returning an array of parsed objects
 *
 * USAGE:
 * const entries = await fsReadJsonlAdapter({ filePath: AbsoluteFilePathStub({ value: '/path/to/file.jsonl' }) });
 * // Returns array of parsed JSON objects from each line
 */

import { readFile } from 'fs/promises';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsReadJsonlAdapter = async ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): Promise<unknown[]> => {
  const content = await readFile(filePath, 'utf8');
  const lines = content.split('\n');

  const parsed: unknown[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    parsed.push(JSON.parse(trimmed));
  }

  return parsed;
};
