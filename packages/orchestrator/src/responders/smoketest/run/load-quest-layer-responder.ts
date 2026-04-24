/**
 * PURPOSE: Layer helper for SmoketestRunResponder — loads the just-hydrated quest so the responder can pull fields (title, status) for the queue entry
 *
 * USAGE:
 * const quest = await LoadQuestLayerResponder({ questId });
 * // Returns the loaded Quest.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../../brokers/quest/load/quest-load-broker';

const QUEST_FILE_NAME = 'quest.json';

export const LoadQuestLayerResponder = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<Quest> => {
  const { questPath } = await questFindQuestPathBroker({ questId });
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
  );
  return questLoadBroker({ questFilePath });
};
