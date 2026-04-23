/**
 * PURPOSE: Loads the full quest for a given questId by resolving its path and reading the quest file
 *
 * USAGE:
 * const quest = await loadQuestByIdLayerBroker({ questId });
 * // Returns the parsed Quest; throws if the quest folder or file is missing
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../quest/load/quest-load-broker';

const QUEST_FILE_NAME = 'quest.json';

export const loadQuestByIdLayerBroker = async ({
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
