/**
 * PURPOSE: Lists a directory's entry names, answering `null` when the directory is not there
 * instead of rejecting. `null` is kept distinct from `[]` so "never existed" and "exists but
 * empty" stay apart for a caller that has to tell them apart.
 *
 * USAGE:
 * await readdirIfExists('/repo/.dungeonmaster/quests');
 * // Returns every entry name, or null when the directory does not exist
 */

import { readdir } from './readdir';
import { isFsError } from '../is-fs-error';

export const readdirIfExists = async (path: string): Promise<string[] | null> => {
  try {
    return await readdir(path);
  } catch (error: unknown) {
    if (isFsError({ error, code: 'ENOENT' })) {
      return null;
    }
    throw error;
  }
};
