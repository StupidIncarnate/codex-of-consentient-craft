/**
 * PURPOSE: Returns the deterministic blight checklist for a quest's diff — every changed file
 * crossed with every BlightConcern, measured from `quest.baseRef` inside the quest's own
 * worktree, plus which of those units still carry no disposition in the quest's blight ledger.
 * The diff must run inside the quest's own tree because the quest's commits exist only on its
 * branch — computed from the repo root's checkout (which stays on the base branch) the same diff
 * finds none of them and comes back empty or describing unrelated work.
 *
 * USAGE:
 * const checklist = await questGetBlightChecklistBroker({ questId });
 * // Returns BlightChecklist, or null when the quest has no pinned baseRef
 *
 * A quest seeded before the review base was pinned has no `baseRef` and therefore no diff to
 * measure — that is a real state, not an error, so this returns null rather than throwing.
 *
 * The quest's own `packagesAffected` travels with the diff because a changed path only names a
 * package relative to the declarations of the repo it came from; resolving it anywhere else would
 * have to guess a layout.
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
    packagesAffected: quest.packagesAffected,
    projectRoot: resolution.cwd,
    baseRef,
  });
};
