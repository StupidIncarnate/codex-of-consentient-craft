/**
 * PURPOSE: Reads the target string a symlink stores, WITHOUT resolving it — unlike
 * fsRealpathAdapter, which chases the whole chain and requires the final target to exist. This is
 * what `installLinkCreateResponder` reads before deciding whether `<repoRoot>/.dungeonmaster-assets/siegelense-assets` already
 * points at the right siegelense root, since that decision is about what the link STORES, not
 * about whether the stored path currently resolves.
 *
 * USAGE:
 * await fsReadlinkAdapter({ linkPath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }) });
 * // Returns AbsoluteFilePath — the stored target, e.g. '/home/user/.dungeonmaster/siegelense'
 */

import { readlink } from 'fs/promises';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsReadlinkAdapter = async ({
  linkPath,
}: {
  linkPath: AbsoluteFilePath;
}): Promise<AbsoluteFilePath> => {
  const target = await readlink(linkPath);
  return absoluteFilePathContract.parse(target);
};
