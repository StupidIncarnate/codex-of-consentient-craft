/**
 * PURPOSE: Loads a quest and computes the likely remainder of its execution — every MINTED
 * scope's real work items, continued forward through `agentFlowStatics`'s `routes.done` edge
 *
 * USAGE:
 * const projection = await questGetProjectionBroker({ questId });
 * // Returns QuestProjection for that quest
 *
 * THE COMPUTATION IS THE TRANSFORMER'S, not this broker's — mirrors `questGetSummaryBroker`'s own
 * split, so the projection of an in-memory quest and the projection of the same quest on disk are
 * the same value by construction.
 *
 * An unknown questId THROWS, from `questFindQuestPathBroker`. There is no honest empty projection
 * for a quest that does not exist.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { QuestId, QuestProjection } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { questProjectionBuildTransformer } from '../../../transformers/quest-projection-build/quest-projection-build-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export const questGetProjectionBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<QuestProjection> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  const quest = await questLoadBroker({ questFilePath });

  return questProjectionBuildTransformer({ quest });
};
