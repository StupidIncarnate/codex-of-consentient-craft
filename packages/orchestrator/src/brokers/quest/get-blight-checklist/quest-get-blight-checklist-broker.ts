/**
 * PURPOSE: Returns the deterministic blight checklist for a quest's diff — every changed file
 * crossed with every BlightConcern, measured from `quest.baseRef` in whatever checkout
 * `questCwdResolveBroker` says this quest lives in, plus which of those units still carry no
 * disposition in the quest's blight ledger. A worktree quest MUST be measured inside its own tree:
 * its commits exist only on its branch, and the repo root stays on the base branch, so the same
 * diff run there finds none of them. A quest that predates worktrees carries no `worktreePath` and
 * resolves to the repo root — which is correct for it, because the repo root checkout IS where its
 * branch is; the fallback is load-bearing, not a degraded path.
 *
 * USAGE:
 * const checklist = await questGetBlightChecklistBroker({ questId });
 * // Returns BlightChecklist, or null when the quest has no pinned baseRef
 *
 * A quest seeded before the review base was pinned has no `baseRef` and therefore no diff to
 * measure — that is a real state, not an error, so this returns null rather than throwing.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { BlightChecklist, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { gitDiffFilesAdapter } from '../../../adapters/git/diff-files/git-diff-files-adapter';
import { blightChecklistBuildTransformer } from '../../../transformers/blight-checklist-build/blight-checklist-build-transformer';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export const questGetBlightChecklistBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<BlightChecklist | null> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  const quest = await questLoadBroker({ questFilePath });
  const { baseRef } = quest;

  if (baseRef === undefined) {
    return null;
  }

  const resolution = await questCwdResolveBroker({ questId });

  if (resolution.kind === 'missing-worktree') {
    throw new Error(
      `Cannot compute the blight checklist for quest ${questId}: worktree not found: ${resolution.worktreePath}`,
    );
  }

  const changedFiles = await gitDiffFilesAdapter({ cwd: resolution.cwd, baseRef });

  return blightChecklistBuildTransformer({
    changedFiles,
    ledger: quest.planningNotes.blightLedger,
    baseRef,
  });
};
