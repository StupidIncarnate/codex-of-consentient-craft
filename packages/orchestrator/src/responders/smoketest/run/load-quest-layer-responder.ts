/**
 * PURPOSE: Layer helper for SmoketestRunResponder — loads the just-hydrated quest so the responder can pull fields (title, status) for the queue entry
 *
 * USAGE:
 * const quest = await LoadQuestLayerResponder({ questId });
 * // Returns the loaded Quest.
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { join } from '#gateway/node/path';

import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../../brokers/quest/load/quest-load-broker';

export const LoadQuestLayerResponder = async ({
  questId,
}: {
  questId: Quest['id'];
}): Promise<Quest> => {
  const { questPath } = await questFindQuestPathBroker({ questId });
  const questFilePath = join(questPath, locationsStatics.quest.questFile);
  return questLoadBroker({ questFilePath });
};
