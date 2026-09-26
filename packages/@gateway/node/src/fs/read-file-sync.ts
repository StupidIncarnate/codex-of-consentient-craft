/**
 * PURPOSE: OUR guarded `fs.readFileSync`: fixed UTF-8, always a `string`, and every OS error
 * (ENOENT, EACCES, EISDIR, ...) passed through unchanged so a caller can inspect `.code`
 * directly. Reach for `readFileSyncIfExists` when a missing file is a valid answer.
 *
 * USAGE:
 * const contents = readFileSync('/tmp/config.json');
 * // Returns the file's contents as a UTF-8 string, or throws the raw NodeJS.ErrnoException
 */
import { readFileSync as nodeReadFileSync } from 'fs';

export const readFileSync = (path: string): string => nodeReadFileSync(path, 'utf8');
