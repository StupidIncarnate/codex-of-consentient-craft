/**
 * PURPOSE: Wraps `fs.readdirSync`, returning bare filenames. Every OS error (ENOENT, EACCES,
 * ENOTDIR) passes through raw; an empty directory returns `[]`.
 *
 * USAGE:
 * const names = readdirSync('/tmp/adir');
 * // Returns the directory's entry names, or throws the raw NodeJS.ErrnoException
 */
import { readdirSync as nodeReaddirSync } from 'fs';

export const readdirSync = (path: string): string[] => nodeReaddirSync(path);
