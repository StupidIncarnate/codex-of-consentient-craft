/**
 * PURPOSE: Reads back a symlink's raw stored target — relative or absolute, unresolved — so a
 * worktree node_modules scan can tell a workspace link (relative, needs re-pointing) from a
 * third-party one (absolute, left alone) without a thrown ENOENT/EINVAL interrupting the walk
 * over entries that aren't all symlinks.
 *
 * USAGE:
 * await fsReadlinkAdapter({ linkPath: FilePathStub({ value: '/worktree/node_modules/@dungeonmaster/orchestrator' }) });
 * // Returns the link's raw target, or null when linkPath isn't a readable symlink
 */

import { readlink } from 'fs/promises';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReadlinkAdapter = async ({
  linkPath,
}: {
  linkPath: FilePath;
}): Promise<FilePath | null> => {
  try {
    const target = await readlink(linkPath);
    return filePathContract.parse(target);
  } catch {
    return null;
  }
};
