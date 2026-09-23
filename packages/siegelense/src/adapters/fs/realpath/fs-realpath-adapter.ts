/**
 * PURPOSE: Resolves the real, symlink-chain-followed target of a path — the only way to tell WHAT
 * `<repoRoot>/.dungeonmaster-assets/siegelense-assets` points at, since `existsSync`/`access` only answer whether something
 * resolves there, never its identity. No shared adapter wraps `fs.realpath` yet, so this one is
 * local to siegelense; `locationsRepoLinkPathFindBroker` is its one caller, distinguishing a link
 * onto this machine's siegelense root from a link left over onto a different one.
 *
 * USAGE:
 * await fsRealpathAdapter({ filePath: FilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets' }) });
 * // Returns AbsoluteFilePath — the resolved target, e.g. '/home/user/.dungeonmaster/siegelense'
 */

import { realpath } from 'fs/promises';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FilePath } from '@dungeonmaster/shared/contracts';

export const fsRealpathAdapter = async ({
  filePath,
}: {
  filePath: FilePath;
}): Promise<AbsoluteFilePath> => {
  const resolved = await realpath(filePath);
  return absoluteFilePathContract.parse(resolved);
};
