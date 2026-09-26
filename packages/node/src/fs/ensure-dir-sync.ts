/**
 * PURPOSE: Wraps `fs.mkdirSync`, always recursive — no production caller passes
 * `recursive: false`, so the option is not exposed. Every OS error passes through raw.
 *
 * USAGE:
 * ensureDirSync('/tmp/a/b/c');
 * // Creates every missing segment of the path; does nothing if it already exists
 */
import { mkdirSync } from 'fs';

export const ensureDirSync = (path: string): void => {
  mkdirSync(path, { recursive: true });
};
