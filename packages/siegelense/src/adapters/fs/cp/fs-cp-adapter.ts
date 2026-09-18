/**
 * PURPOSE: Copies the CONTENTS of one directory into another, entry by entry, skipping one top-level
 * entry by name. It is not a single `fs.cp` of the whole tree, and cannot be: **`fs.cp` refuses a
 * destination inside its own source** — `EINVAL: cannot copy <home> to a subdirectory of self
 * <home>/.siegelense-snapshots/1` — and the snapshot store lives inside the throwaway home it copies,
 * because that is the only placement `kill`'s single `rm` of that home already removes. Copying each
 * child separately makes every destination a sibling path rather than a descendant, and the skipped
 * name is what keeps the store out of its own copy. Reach for this over `fsWriteFileAdapter` whenever
 * the unit being written is a TREE: a hand-rolled walk would have to decide what to do with symlinks,
 * modes and nested directories, and `fs.cp` already decided for each child.
 *
 * USAGE:
 * await fsCpAdapter({
 *   sourcePath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1' }),
 *   destinationPath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1/.siegelense-snapshots/1' }),
 *   excludeName: '.siegelense-snapshots',
 * });
 * // Copies every child of the source except that one, then returns { success: true }
 */

import { cp, readdir } from 'fs/promises';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsCpAdapter = async ({
  sourcePath,
  destinationPath,
  excludeName,
}: {
  sourcePath: AbsoluteFilePath;
  destinationPath: AbsoluteFilePath;
  excludeName: string | null;
}): Promise<AdapterResult> => {
  const entries = await readdir(sourcePath);

  await Promise.all(
    entries
      .filter((entry) => entry !== excludeName)
      .map(async (entry) =>
        cp(`${String(sourcePath)}/${entry}`, `${String(destinationPath)}/${entry}`, {
          recursive: true,
          force: true,
        }),
      ),
  );

  return { success: true as const };
};
