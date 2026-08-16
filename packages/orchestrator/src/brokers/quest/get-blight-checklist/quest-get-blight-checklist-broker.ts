/**
 * PURPOSE: Returns the deterministic blight checklist for one of THREE review surfaces — every file
 * on that surface crossed with every applicable BlightConcern, measured in whatever checkout
 * `questCwdResolveBroker` says this quest lives in, plus which of those units still carry no
 * disposition in the quest's blight ledger. A worktree quest MUST be measured inside its own tree:
 * its commits exist only on its branch, and the repo root stays on the base branch, so the same
 * diff run there finds none of them. A quest that predates worktrees carries no `worktreePath` and
 * resolves to the repo root — which is correct for it, because the repo root checkout IS where its
 * branch is; the fallback is load-bearing, not a degraded path.
 *
 * USAGE:
 * const checklist = await questGetBlightChecklistBroker({ questId, scope: 'working-tree' });
 * // Returns BlightChecklist, or null when the scope needs a review base the quest never pinned
 *
 * The three scopes answer three different questions and are not interchangeable:
 * - `quest` measures the whole review surface from the pinned `quest.baseRef`
 * - `commit` measures ONE session's committed output (`HEAD~1`)
 * - `working-tree` measures what is changed but NOT YET COMMITTED — the surface of a reviewer that
 *   runs inside another session's turn, BEFORE it commits, where nothing under review is in
 *   history yet. Alone among the three it needs no review base, only HEAD, so it answers on a quest
 *   with no pinned `baseRef`; and alone among the three it cannot be a `git diff`, which reports
 *   tracked paths only — `gitWorkingTreeFilesBroker` unions in the untracked additions, which on a
 *   pre-commit surface are every net-new file the session just wrote.
 *
 * A quest seeded before the review base was pinned has no `baseRef`, so `quest` and `commit` have
 * no diff to measure — that is a real state, not an error, so this returns null rather than
 * throwing.
 *
 * The quest's own `packagesAffected` travels with the diff because a changed path only names a
 * package relative to the declarations of the repo it came from; resolving it anywhere else would
 * have to guess a layout.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract, questContract } from '@dungeonmaster/shared/contracts';
import type { BlightChecklist, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { gitDiffFilesAdapter } from '../../../adapters/git/diff-files/git-diff-files-adapter';
import { blightChecklistBuildTransformer } from '../../../transformers/blight-checklist-build/blight-checklist-build-transformer';
import { gitWorkingTreeFilesBroker } from '../../git/working-tree-files/git-working-tree-files-broker';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export const questGetBlightChecklistBroker = async ({
  questId,
  scope = 'quest',
}: {
  questId: QuestId;
  // `commit` measures the LAST COMMIT alone — one session's output. `working-tree` measures what is
  // changed but not yet committed — the surface of a reviewer running inside another session's turn
  // before it commits. `quest` keeps the original `baseRef`-to-HEAD reading for any caller that
  // wants the full review surface.
  scope?: 'quest' | 'commit' | 'working-tree';
}): Promise<BlightChecklist | null> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  const quest = await questLoadBroker({ questFilePath });
  const { baseRef } = quest;

  // `HEAD~1` is one session's output, because every relay prompt enforces one commit per session.
  // Two degenerate cases are handled by the ledger rather than by persisted bookkeeping: a session
  // that committed NOTHING lands its scout on the previous commit, whose units already carry
  // dispositions, so `remainingItemIds` comes back empty and the scout signals `done` immediately;
  // and a file re-touched by a later commit is re-listed and re-dispositioned, since the ledger
  // REPLACES on `itemId` rather than appending. That self-correction is why no scout has to
  // remember where the last one stopped.
  //
  // `working-tree` is measured from HEAD alone and is checked FIRST, ahead of the `baseRef` guard,
  // because it is the one scope that needs no review base: a session reviewing its own uncommitted
  // work has HEAD whether or not anyone ever pinned one, and gating it on `baseRef` would return
  // null — read downstream as "nothing to review" — for exactly the surface that has the most.
  const measuredFrom =
    scope === 'working-tree'
      ? questContract.shape.baseRef.unwrap().parse('HEAD')
      : baseRef === undefined
        ? undefined
        : scope === 'commit'
          ? questContract.shape.baseRef.unwrap().parse('HEAD~1')
          : baseRef;

  if (measuredFrom === undefined) {
    return null;
  }

  const resolution = await questCwdResolveBroker({ questId });

  if (resolution.kind === 'missing-worktree') {
    throw new Error(
      `Cannot compute the blight checklist for quest ${questId}: worktree not found: ${resolution.worktreePath}`,
    );
  }

  // A working tree is not a commit range: `git diff` in every form reports TRACKED paths only, so
  // a net-new file a session has just written is invisible to it. That reading is unioned with the
  // untracked additions in gitWorkingTreeFilesBroker; measuring this scope with the diff adapter
  // alone would silently skip exactly the files most likely to carry a defect and come back green.
  const changedFiles = await (scope === 'working-tree'
    ? gitWorkingTreeFilesBroker({ cwd: resolution.cwd })
    : gitDiffFilesAdapter({ cwd: resolution.cwd, baseRef: measuredFrom }));

  return blightChecklistBuildTransformer({
    changedFiles,
    ledger: quest.planningNotes.blightLedger,
    packagesAffected: quest.packagesAffected,
    projectRoot: resolution.cwd,
    baseRef: measuredFrom,
  });
};
