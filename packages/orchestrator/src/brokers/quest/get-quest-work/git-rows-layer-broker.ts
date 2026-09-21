/**
 * PURPOSE: Reads every git fact `get-quest-work` serves, so no dispatched session ever runs git
 * itself. Split out of `questGetQuestWorkBroker` as a layer because it is the only half of that
 * broker that touches a working tree, and keeping it here is what lets the rest of the view be
 * assembled from `quest.json` alone.
 *
 * USAGE:
 * await gitRowsLayerBroker({ questId, quest });
 * // Returns { git, uncommittedPaths, committedPaths }
 *
 * `uncommittedPaths` IS `gitWorkingTreeFilesBroker`, NEVER A BARE DIFF. That broker unions
 * `git diff HEAD --name-only` with `git ls-files --others --exclude-standard`, and the union is the
 * whole point: a diff reports TRACKED paths only, so the net-new files a worker just wrote — the
 * ones most likely to carry the defect — would be invisible to the reviewer this row exists for.
 *
 * A QUEST WITH NO REACHABLE WORKTREE GETS EMPTY LISTS, NEVER A THROW. `repo-root` means the quest
 * predates worktrees or none was recorded, and `missing-worktree` means a path was recorded and is
 * gone: both are real states a hydrated or half-carved quest legitimately sits in, and the commit
 * gate already treats them that way. Erroring would take the whole brief down over a row a planner
 * merely reads for context.
 *
 * NO `sessionId` IS PASSED, deliberately. That argument asks "where did this session already run",
 * which on a carved quest answers the intake conversation's cwd rather than the worktree every
 * dispatched role works in.
 */

import {
  absoluteFilePathContract,
  type Quest,
  type QuestId,
  type RepoRelativePath,
} from '@dungeonmaster/shared/contracts';

import { gitLogNameOnlyAdapter } from '../../../adapters/git/log-name-only/git-log-name-only-adapter';
import type {
  QuestWorkCommit,
  QuestWorkGit,
} from '../../../contracts/quest-work-view/quest-work-view-contract';
import { gitWorkingTreeFilesBroker } from '../../git/working-tree-files/git-working-tree-files-broker';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';

export const gitRowsLayerBroker = async ({
  questId,
  quest,
}: {
  questId: QuestId;
  quest: Quest;
}): Promise<{
  git: QuestWorkGit;
  uncommittedPaths: RepoRelativePath[];
  committedPaths: QuestWorkCommit[];
}> => {
  const git = {
    baseBranch: quest.baseBranch ?? null,
    worktreePath: quest.worktreePath ?? null,
    baseRef: quest.baseRef ?? null,
  };

  const resolution = await questCwdResolveBroker({ questId });

  if (resolution.kind !== 'worktree') {
    return { git, uncommittedPaths: [], committedPaths: [] };
  }

  const cwd = absoluteFilePathContract.parse(resolution.cwd);
  const { baseRef } = quest;

  const [uncommittedPaths, committedPaths] = await Promise.all([
    gitWorkingTreeFilesBroker({ cwd }),
    // No pinned base means no range to read, and `HEAD..HEAD` would answer the wrong question
    // rather than erroring — so the honest answer is an empty list.
    baseRef === undefined
      ? Promise.resolve<QuestWorkCommit[]>([])
      : gitLogNameOnlyAdapter({ cwd, baseRef }),
  ]);

  return { git, uncommittedPaths, committedPaths };
};
