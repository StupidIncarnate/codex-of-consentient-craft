/**
 * PURPOSE: Reads a path's metadata, answering `null` rather than throwing when it is not there.
 * The e2e artifact sweep needs an mtime and races other sweeps for the same paths, so "gone
 * already" is its ordinary case rather than an error. Reach for this over fsExistsSyncAdapter
 * whenever the age matters and not just the presence.
 *
 * Ward keeps its own copy because ward depends on `@dungeonmaster/shared` and zod alone; cli,
 * hooks and mcp each carry an identical one. Hoisting the four into shared is a separate change.
 *
 * USAGE:
 * const stats = await fsStatAdapter({ filePath: FilePathStub({ value: '/pkg/node_modules/.vite-40000' }) });
 * // Returns Stats with mtimeMs, or null when the path is absent
 */

import { stat } from 'fs/promises';
import type { Stats } from 'fs';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsStatAdapter = async ({
  filePath,
}: {
  filePath: FilePath;
}): Promise<Stats | null> => {
  try {
    return await stat(filePath);
  } catch (error: unknown) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: unknown }).code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  }
};
