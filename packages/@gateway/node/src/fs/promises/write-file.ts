/**
 * PURPOSE: Writes UTF-8 text to a file, overwriting it if it already exists. This is OUR guarded
 * `writeFile` — the gateway never re-exports Node's raw one. Not atomic: a crash mid-write leaves a
 * truncated file, so reach for writeFileAtomic when a reader must never see a half-written file.
 *
 * USAGE:
 * await writeFile('/repo/.dungeonmaster/queue.json', '{"items":[]}');
 * // Writes the file; rejects with the raw NodeJS.ErrnoException on ENOENT/EACCES/EISDIR
 */

import { writeFile as fsWriteFile } from 'fs/promises';

export const writeFile = async (path: string, contents: string): Promise<void> =>
  fsWriteFile(path, contents, 'utf8');
