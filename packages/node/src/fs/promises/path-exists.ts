/**
 * PURPOSE: Checks whether a path is visible, without distinguishing further. "Missing" collapses
 * ENOENT and ENOTDIR (a parent segment that isn't a directory) to `false`; EACCES rejects, because
 * a permission failure means the answer is unknown, not "false".
 *
 * USAGE:
 * await pathExists('/repo/.dungeonmaster.json');
 * // Returns true or false; rejects on EACCES
 */

import { access } from 'fs/promises';
import { isFsError } from '../is-fs-error';

export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch (error: unknown) {
    if (isFsError({ error, code: 'ENOENT' }) || isFsError({ error, code: 'ENOTDIR' })) {
      return false;
    }
    throw error;
  }
};
