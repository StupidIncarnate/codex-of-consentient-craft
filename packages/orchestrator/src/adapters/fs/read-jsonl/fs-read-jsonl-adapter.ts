/**
 * PURPOSE: Reads a JSONL file and returns an array of non-empty lines as raw strings
 *
 * USAGE:
 * const lines = await fsReadJsonlAdapter({ filePath: AbsoluteFilePathStub({ value: '/path/to/session.jsonl' }) });
 * // Returns array of raw line strings (not parsed JSON)
 */

import { readFile } from 'fs/promises';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { streamJsonLineContract } from '../../../contracts/stream-json-line/stream-json-line-contract';

export const fsReadJsonlAdapter = async ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): Promise<StreamJsonLine[]> => {
  const content = await readFile(filePath, 'utf8');
  const lines = content.split('\n');

  const result: StreamJsonLine[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    result.push(streamJsonLineContract.parse(trimmed));
  }

  return result;
};
