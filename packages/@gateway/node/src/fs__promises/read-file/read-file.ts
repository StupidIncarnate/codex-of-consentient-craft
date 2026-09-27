/**
 * PURPOSE: Reads a whole file as UTF-8 text. This is OUR guarded `readFile` — the gateway never
 * re-exports Node's raw one — so every caller gets the same encoding and the same raw-error
 * behaviour on ENOENT/EACCES/EISDIR/ENOTDIR. Reach for readFileIfExists instead when a missing
 * file is an ordinary answer, not a fault.
 *
 * USAGE:
 * await readFile('/repo/.dungeonmaster.json');
 * // Returns the file's contents as a string; rejects with the raw NodeJS.ErrnoException on ENOENT
 */

import { readFile as fsReadFile } from 'fs/promises';

export const readFile = async (path: string): Promise<string> => fsReadFile(path, 'utf8');
