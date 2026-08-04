/**
 * PURPOSE: Returns the deterministic blight checklist for a quest's diff — every changed file
 * crossed with every BlightConcern, measured from `quest.baseRef`, plus which of those units
 * still carry no disposition in the quest's blight ledger
 *
 * USAGE:
 * const checklist = await questGetBlightChecklistBroker({ questId });
 * // Returns BlightChecklist, or null when the quest has no pinned baseRef
 *
 * A quest seeded before the review base was pinned has no `baseRef` and therefore no diff to
 * measure — that is a real state, not an error, so this returns null rather than throwing.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract, repoRootCwdContract } from '@dungeonmaster/shared/contracts';
import type { BlightChecklist, QuestId, RepoRootCwd } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { gitDiffFilesAdapter } from '../../../adapters/git/diff-files/git-diff-files-adapter';
import { blightChecklistBuildTransformer } from '../../../transformers/blight-checklist-build/blight-checklist-build-transformer';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export const questGetBlightChecklistBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<BlightChecklist | null> => {
  const { questPath, guildId } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  const quest = await questLoadBroker({ questFilePath });
  const { baseRef } = quest;

  if (baseRef === undefined) {
    return null;
  }

  const guild = await guildGetBroker({ guildId });
  const guildStartPath = filePathContract.parse(guild.path);
  const cwd = await (async (): Promise<RepoRootCwd> => {
    try {
      return await cwdResolveBroker({ startPath: guildStartPath, kind: 'repo-root' });
    } catch {
      return repoRootCwdContract.parse(guild.path);
    }
  })();

  const changedFiles = await gitDiffFilesAdapter({ cwd, baseRef });

  return blightChecklistBuildTransformer({
    changedFiles,
    ledger: quest.planningNotes.blightLedger,
    baseRef,
  });
};
