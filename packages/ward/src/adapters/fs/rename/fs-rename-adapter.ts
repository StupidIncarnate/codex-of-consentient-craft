/**
 * PURPOSE: Moves a path, and lets the FAILURE be the useful answer. Reach for this — never a
 * copy, and never a remove-then-move — wherever two processes may publish the same directory at
 * once: `rename` onto a non-empty destination is refused by the kernel, so the loser learns it lost
 * without either of them having written a byte into a directory the other may be serving.
 *
 * USAGE:
 * await fsRenameAdapter({ fromPath: FilePathStub({ value: '/pkg/.ward/bundle/.tmp-42' }), toPath: FilePathStub({ value: '/pkg/.ward/bundle/<hash>' }) });
 * // Publishes the temp directory under its final name, or throws ENOTEMPTY if a sibling got there first
 */

import { rename } from 'fs/promises';
import type { AdapterResult, FilePath } from '@dungeonmaster/shared/contracts';

export const fsRenameAdapter = async ({
  fromPath,
  toPath,
}: {
  fromPath: FilePath;
  toPath: FilePath;
}): Promise<AdapterResult> => {
  await rename(fromPath, toPath);

  return { success: true as const };
};
