/**
 * PURPOSE: The absolute directories an absolute plan file path may sit under for one quest — its
 * worktree, and the repo root the worktree was carved from. A planner runs with the worktree as its
 * cwd but reads the main checkout's paths too, so both are legal; reach for
 * `workPlanFileRepoRelativeTransformer` to apply them.
 *
 * USAGE:
 * workPlanFileRootsTransformer({ worktreePath: '/repo/worktrees/add-auth-1a2b3c4d' });
 * // Returns ['/repo/worktrees/add-auth-1a2b3c4d', '/repo']
 *
 * The repo root is recovered from the worktree path rather than stored on the quest, because a
 * worktree is always `<repoRoot>/<worktreesDir>/<name>` (`locationsWorktreePathFindBroker`). A quest
 * with no worktree yet has no root a path could be measured against, so it returns an empty list.
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

export const workPlanFileRootsTransformer = ({
  worktreePath,
}: {
  worktreePath: Quest['worktreePath'];
}): string[] => {
  if (worktreePath === undefined) {
    return [];
  }

  const worktree = String(worktreePath).replace(/\/+$/u, '');
  const markerIndex = worktree.lastIndexOf(`/${locationsStatics.repoRoot.worktreesDir}/`);

  return markerIndex <= 0 ? [worktree] : [worktree, worktree.slice(0, markerIndex)];
};
