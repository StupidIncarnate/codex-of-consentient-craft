/**
 * PURPOSE: Reads a path's metadata, answering `null` when it is not there instead of rejecting.
 * A status read races other work for the same path, so "gone already" is its ordinary case.
 *
 * USAGE:
 * await statIfExists('/repo/node_modules/.vite-40000');
 * // Returns { kind, sizeBytes, modifiedAtMs }, or null when the path does not exist
 */

import { stat } from './stat';
import type { FileStat } from './stat';
import { isFsError } from '../is-fs-error';

export const statIfExists = async (path: string): Promise<FileStat | null> => {
  try {
    return await stat(path);
  } catch (error: unknown) {
    if (isFsError({ error, code: 'ENOENT' })) {
      return null;
    }
    throw error;
  }
};
