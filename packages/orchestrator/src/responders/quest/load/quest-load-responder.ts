/**
 * PURPOSE: Loads a full quest by ID, resolving the quest path and reading the JSON file
 *
 * USAGE:
 * const quest = await QuestLoadResponder({ questId });
 * // Returns the full Quest object
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../../brokers/quest/load/quest-load-broker';

const QUEST_FILE_NAME = 'quest.json';

export const QuestLoadResponder = async ({ questId }: { questId: QuestId }): Promise<Quest> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
  );

  return questLoadBroker({ questFilePath });
};
