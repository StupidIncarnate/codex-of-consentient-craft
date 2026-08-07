/**
 * PURPOSE: Loads a quest and computes its whole verification state — per-flow, per-track sign-off
 * counts, the observables added after approval, every `unconfirmable` verdict, and the side-channel
 * notes grouped by kind
 *
 * USAGE:
 * const summary = await questGetSummaryBroker({ questId });
 * // Returns QuestSummary for that quest
 *
 * WHEN-TO-USE: Whenever a reader needs to know what a quest's status does NOT say. `complete` means
 * both tracks signed every unit, and `unconfirmable` signs a unit exactly as `confirmed` does, so a
 * green quest can still carry holes, scope nobody approved, and unanswered questions.
 *
 * THE COMPUTATION IS THE TRANSFORMER'S, not this broker's. All this owns is resolving the quest file
 * and reading it, so the summary of an in-memory quest and the summary of the same quest on disk are
 * the same value by construction.
 *
 * An unknown questId THROWS, from `questFindQuestPathBroker`. There is no honest empty summary for a
 * quest that does not exist — an empty one would read as "this quest has no verification work",
 * which is the opposite of "we could not find it".
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { QuestId, QuestSummary } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { questSummaryBuildTransformer } from '../../../transformers/quest-summary-build/quest-summary-build-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export const questGetSummaryBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<QuestSummary> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  const quest = await questLoadBroker({ questFilePath });

  return questSummaryBuildTransformer({ quest });
};
