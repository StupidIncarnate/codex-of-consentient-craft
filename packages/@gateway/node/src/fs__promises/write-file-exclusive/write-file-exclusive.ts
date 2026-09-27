/**
 * PURPOSE: Creates a file only when it does not already exist, using the OS `'wx'` flag so the
 * existence check and the create happen as ONE atomic operation. That is what a caller builds an
 * actual lock out of — a separate check-then-write leaves a gap two processes can both pass
 * through. EEXIST rejects raw; that IS the lock signal a caller reads.
 *
 * USAGE:
 * await writeFileExclusive('/repo/.dungeonmaster/boot.lock', String(process.pid));
 * // Creates the file; rejects with a raw EEXIST-coded error when it already exists
 */

import { writeFile as fsWriteFile } from 'fs/promises';

export const writeFileExclusive = async (path: string, contents: string): Promise<void> =>
  fsWriteFile(path, contents, { encoding: 'utf8', flag: 'wx' });
