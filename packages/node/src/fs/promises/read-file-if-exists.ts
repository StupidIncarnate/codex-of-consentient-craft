/**
 * PURPOSE: Reads a whole file as UTF-8 text, answering `null` when it is not there instead of
 * rejecting. "Missing" means ENOENT only — EACCES, EISDIR and ENOTDIR still reject, because those
 * are real problems with the read, not an absent file.
 *
 * USAGE:
 * await readFileIfExists('/repo/.dungeonmaster.json');
 * // Returns the file's contents, or null when the path does not exist
 */

import { readFile } from './read-file';
import { isFsError } from '../is-fs-error';

export const readFileIfExists = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path);
  } catch (error: unknown) {
    if (isFsError({ error, code: 'ENOENT' })) {
      return null;
    }
    throw error;
  }
};
