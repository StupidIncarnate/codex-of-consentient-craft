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

import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

export const locationsWorktreePathFindBroker = ({
  repoRoot,
  worktreeDirName,
}: {
  repoRoot: AbsoluteFilePath;
  worktreeDirName: FileName;
}): AbsoluteFilePath => {
  const joined = pathJoinAdapter({
    paths: [repoRoot, locationsStatics.repoRoot.worktreesDir, worktreeDirName],
  });

  return absoluteFilePathContract.parse(joined);
};
