/**
 * PURPOSE: Lists a directory's entry names. This is OUR guarded `readdir` — plain names only, no
 * `Dirent` objects; reach for readdirEntries when the caller needs to know each entry's kind.
 *
 * USAGE:
 * await readdir('/repo/.dungeonmaster/quests');
 * // Returns every entry name directly under the path; rejects on ENOENT and every other failure
 */

import { readdir as fsReaddir } from 'fs/promises';

export const readdir = async (path: string): Promise<string[]> => fsReaddir(path);
