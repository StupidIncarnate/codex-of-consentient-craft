/**
 * PURPOSE: Removes a single file, resolving instead of rejecting when it is already gone. "Missing"
 * means ENOENT only — EACCES and EISDIR still reject, because those are real problems with the
 * removal, not an absent file. Covers the release side of a lock file, where a competitor may have
 * already removed it.
 *
 * USAGE:
 * await unlinkIfExists('/repo/.dungeonmaster/boot.lock');
 * // Removes the file; resolves without error when it does not exist
 */

import { unlink } from '../unlink/unlink';
import { isFsError } from '../../fs/is-fs-error/is-fs-error';

export const unlinkIfExists = async (path: string): Promise<void> => {
  try {
    await unlink(path);
  } catch (error: unknown) {
    if (!isFsError({ error, code: 'ENOENT' })) {
      throw error;
    }
  }
};
