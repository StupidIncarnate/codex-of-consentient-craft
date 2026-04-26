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
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../../brokers/quest/load/quest-load-broker';

export const QuestLoadResponder = async ({ questId }: { questId: QuestId }): Promise<Quest> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  return questLoadBroker({ questFilePath });
};
