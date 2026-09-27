/**
 * PURPOSE: Wraps Node's `fs.existsSync`, keeping its exact meaning: `false` on ANY failure,
 * EACCES included, never a thrown error. A caller that must tell "permission denied" apart
 * from "not there" reaches for `pathExists` in `#gateway/node/fs__promises` instead.
 *
 * USAGE:
 * existsSync('/tmp/maybe.json');
 * // Returns true when the path resolves, false otherwise (missing or unreadable)
 */
import { existsSync as nodeExistsSync } from 'fs';

export const existsSync = (path: string): boolean => nodeExistsSync(path);
