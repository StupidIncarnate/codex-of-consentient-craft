/**
 * PURPOSE: Writes UTF-8 text so a reader never observes a half-written file: the bytes land at a
 * sibling `.tmp` path first, then `rename` swaps it onto the real path in one atomic step. The temp
 * file is removed if the rename itself fails, so a failed swap never leaves stray `.tmp` litter for
 * the next attempt to trip over. Replaces every hand-built write-then-rename pair in this codebase,
 * none of which cleans up on a failed rename.
 *
 * USAGE:
 * await writeFileAtomic('/repo/.dungeonmaster/registry.json', '{"instances":[]}');
 * // Writes registry.json.tmp, renames it onto registry.json, and removes the tmp file on failure
 */

import { mkdir, rename, unlink, writeFile as fsWriteFile } from 'fs/promises';
import { dirname } from 'path';
import { isFsError } from '../is-fs-error';

export const writeFileAtomic = async (path: string, contents: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });

  const tmpPath = `${path}.tmp`;
  await fsWriteFile(tmpPath, contents, 'utf8');

  try {
    await rename(tmpPath, path);
  } catch (renameError: unknown) {
    try {
      await unlink(tmpPath);
    } catch (unlinkError: unknown) {
      if (!isFsError({ error: unlinkError, code: 'ENOENT' })) {
        throw unlinkError;
      }
    }
    throw renameError;
  }
};
