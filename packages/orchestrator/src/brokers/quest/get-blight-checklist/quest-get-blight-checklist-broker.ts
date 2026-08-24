/**
 * PURPOSE: Returns the deterministic blight checklist for one of FIVE review surfaces — every file
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
 * The five scopes answer five different questions and are not interchangeable:
 * - `quest` measures the whole review surface from the pinned `quest.baseRef`
 * - `commit` measures ONE session's committed output (`HEAD~1`)
 * - `unpushed` measures ONE ROUND — `@{upstream}..HEAD`, everything committed here and not yet
 *   published. It is the reviewer-minion's scope: worker-minions commit their own pieces, so by the
 *   time a reviewer runs there is nothing uncommitted for `working-tree` to find, and several
 *   commits have landed since, so `commit` sees only the last of them. The operator pushes once
 *   at the end of each round, which is what makes "unpushed" mean "this round" — a boundary git
 *   maintains itself, with no id threaded through a prompt and nothing for an agent to get wrong.
 *   A branch tracking no upstream (a quest carved before riftcarver pushed) falls back to the
 *   quest's `baseRef` — over-reporting the surface rather than under-reporting it, because a
 *   reviewer shown too much re-reads a file that is already dispositioned, while one shown too
 *   little never opens a file nobody has read.
 * - `working-tree` measures what is changed but NOT YET COMMITTED. Alone among the five it needs no
 *   review base, only HEAD, so it answers on a quest with no pinned `baseRef`; and alone among the
 *   five it cannot be a `git diff`, which reports tracked paths only — `gitWorkingTreeFilesBroker`
 *   unions in the untracked additions. It survives for a caller measuring an uncommitted surface;
 *   it is NO LONGER the reviewer-minion's scope, since that session's subject is now committed.
 * - `since-ref` measures from a base the CALLER names, in `sinceRef`. It exists for a caller whose
 *   base is neither the quest's nor a fixed offset from HEAD: the signal-back review-coverage gate
 *   measures one WORK ITEM's whole output, which is every commit since that item's recorded
 *   `startRef` — several round commits, not the one `commit` would see, and not the empty set
 *   `working-tree` sees once the round has committed. The ref rides its own parameter rather than
 *   overriding `scope`, so the other three scopes never read it and a caller has to say which
 *   question it is asking.
 *
 * A quest seeded before the review base was pinned has no `baseRef`, so `quest` and `commit` have
 * no diff to measure — and a `since-ref` call with no `sinceRef` names no base at all. Each is a
 * real state, not an error, so this returns null rather than throwing.
 *
 * The quest's own `packagesAffected` travels with the diff because a changed path only names a
 * package relative to the declarations of the repo it came from; resolving it anywhere else would
 * have to guess a layout.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract, questContract } from '@dungeonmaster/shared/contracts';
import type { BlightChecklist, Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { gitDiffFilesAdapter } from '../../../adapters/git/diff-files/git-diff-files-adapter';
import { gitUpstreamShaAdapter } from '../../../adapters/git/upstream-sha/git-upstream-sha-adapter';
import { blightChecklistBuildTransformer } from '../../../transformers/blight-checklist-build/blight-checklist-build-transformer';
import { gitWorkingTreeFilesBroker } from '../../git/working-tree-files/git-working-tree-files-broker';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export const questGetBlightChecklistBroker = async ({
  questId,
  scope = 'quest',
  sinceRef,
}: {
  questId: QuestId;
  // `commit` measures the LAST COMMIT alone — one session's output. `working-tree` measures what is
  // changed but not yet committed. `since-ref` measures from the ref `sinceRef` names. `unpushed`
  // measures ONE ROUND — committed here, not yet published. `quest` keeps the original
  // `baseRef`-to-HEAD reading for any caller that wants the full review surface.
  scope?: 'quest' | 'commit' | 'working-tree' | 'since-ref' | 'unpushed';
  // Read by `scope: 'since-ref'` and by nothing else, so the other scopes cannot change behaviour
  // on a caller that passes it. Absent under that scope, the call names no base and answers null,
  // exactly as an unpinned `baseRef` does for `quest` / `commit`.
  sinceRef?: NonNullable<Quest['baseRef']>;
}): Promise<BlightChecklist | null> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  const quest = await questLoadBroker({ questFilePath });
  const { baseRef } = quest;

  // `HEAD~1` is the LAST COMMIT and nothing else. It is no longer any session's whole output — each
  // worker-minion commits its own piece and the reviewer commits its verdict, so a round lands
  // several commits and a session lands several rounds — which is exactly why the reviewer uses
  // `unpushed` and the signal-back gate uses `since-ref`. What survives here is the narrow reading a
  // caller auditing landed history wants: one commit, on its own.
  //
  // Two degenerate cases are handled by the ledger rather than by persisted bookkeeping: a reading
  // that lands on a commit whose units already carry dispositions comes back with an empty
  // `remainingItemIds`; and a file re-touched by a later commit is re-listed and re-dispositioned,
  // since the ledger REPLACES on `itemId` rather than appending. That self-correction is why no
  // caller has to remember where the last one stopped.
  //
  // `working-tree` is measured from HEAD alone and is checked FIRST, ahead of the `baseRef` guard,
  // because it is the one scope that needs no review base: a session reviewing its own uncommitted
  // work has HEAD whether or not anyone ever pinned one, and gating it on `baseRef` would return
  // null — read downstream as "nothing to review" — for exactly the surface that has the most.
  //
  // `since-ref` is likewise checked ahead of the `baseRef` guard, because the base it measures from
  // is the caller's own and the quest's pinned one is irrelevant to it.
  //
  // `unpushed` is the ONE scope whose base is a fact about the CHECKOUT rather than about the quest
  // record, so it cannot be answered here — it is resolved below, once the cwd is known.
  const recordedBase =
    scope === 'working-tree'
      ? questContract.shape.baseRef.unwrap().parse('HEAD')
      : scope === 'since-ref'
        ? sinceRef
        : baseRef === undefined
          ? undefined
          : scope === 'commit'
            ? questContract.shape.baseRef.unwrap().parse('HEAD~1')
            : baseRef;

  // Every scope but `unpushed` knows its base by now, and a caller that named none is answered
  // before any git spawn — the same early null a quest with no pinned `baseRef` has always got.
  if (scope !== 'unpushed' && recordedBase === undefined) {
    return null;
  }

  const resolution = await questCwdResolveBroker({ questId });

  if (resolution.kind === 'missing-worktree') {
    throw new Error(
      `Cannot compute the blight checklist for quest ${questId}: worktree not found: ${resolution.worktreePath}`,
    );
  }

  // A branch tracking no upstream falls back to the quest's `baseRef`: a reviewer handed null reads
  // it as "nothing to review" and dispositions nothing, which is the one outcome this scope exists
  // to prevent, while a reviewer handed the whole quest re-reads files that already carry a
  // disposition — a wasted pass rather than an unreviewed one.
  const measuredFrom =
    scope === 'unpushed'
      ? ((await gitUpstreamShaAdapter({ cwd: resolution.cwd })) ?? baseRef)
      : recordedBase;

  if (measuredFrom === undefined) {
    return null;
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
