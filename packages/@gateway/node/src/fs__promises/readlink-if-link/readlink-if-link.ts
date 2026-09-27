/**
 * PURPOSE: Reads back a symlink's raw stored target, answering `null` when the path is not there
 * or is not a symlink at all (EINVAL), instead of rejecting. A caller walking mixed entries uses
 * this to skip anything that is not a link without a thrown error interrupting the walk.
 *
 * USAGE:
 * await readlinkIfLink('/repo/.dungeonmaster-assets/siegelense-assets');
 * // Returns the stored target, or null when the path isn't a readable symlink
 */

import { readlink } from '../readlink/readlink';
import { isFsError } from '../../fs/is-fs-error/is-fs-error';

export const readlinkIfLink = async (path: string): Promise<string | null> => {
  try {
    return await readlink(path);
  } catch (error: unknown) {
    if (isFsError({ error, code: 'ENOENT' }) || isFsError({ error, code: 'EINVAL' })) {
      return null;
    }
    throw error;
  }
};
