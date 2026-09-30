/**
 * PURPOSE: Resolves the absolute path to a quest's git worktree directory under the repo root —
 * the worktree directory name doubles as the branch name so a worktree is discoverable from its
 * branch (and vice versa) without reading the quest file.
 *
 * USAGE:
 * locationsWorktreePathFindBroker({
 *   repoRoot: AbsoluteFilePathStub({ value: '/repo' }),
 *   worktreeDirName: FileNameStub({ value: 'add-auth-7bc217a1' }),
 * });
 * // Returns AbsoluteFilePath '/repo/worktrees/add-auth-7bc217a1'
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

export const locationsWorktreePathFindBroker = ({
  repoRoot,
  worktreeDirName,
}: {
  repoRoot: string;
  worktreeDirName: FileName;
}): string => {
  const joined = join(repoRoot, locationsStatics.repoRoot.worktreesDir, worktreeDirName);

  return joined;
};
