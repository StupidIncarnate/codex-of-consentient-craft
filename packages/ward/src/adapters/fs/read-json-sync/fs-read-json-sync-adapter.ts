/**
 * PURPOSE: Reads a file from the filesystem and parses it as JSON, returning the parsed value
 *
 * USAGE:
 * const data = fsReadJsonSyncAdapter({ filePath: filePathContract.parse('/project/tsconfig.json') });
 * // Returns: unknown (the parsed JSON value)
 */

import { readFileSync } from 'fs';

import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReadJsonSyncAdapter = ({ filePath }: { filePath: FilePath }): unknown => {
  const content = readFileSync(String(filePath), 'utf8');
  return JSON.parse(content) as unknown;
};
