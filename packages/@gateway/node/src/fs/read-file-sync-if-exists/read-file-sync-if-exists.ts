/**
 * PURPOSE: Replaces a check-then-read (`existsSync` followed by `readFileSync`), which leaves a
 * gap between the check and the read. ENOENT alone becomes `null`; every other OS error
 * (EACCES, EISDIR, ...) still throws raw, because only "missing" is a valid answer here.
 *
 * USAGE:
 * const contents = readFileSyncIfExists('/tmp/maybe.json');
 * // Returns the file's contents, or null when the path does not exist
 */
import { readFileSync } from '../read-file-sync/read-file-sync';
import { isFsError } from '../is-fs-error/is-fs-error';

export const readFileSyncIfExists = (path: string): string | null => {
  try {
    return readFileSync(path);
  } catch (error) {
    if (isFsError({ error, code: 'ENOENT' })) {
      return null;
    }
    throw error;
  }
};
