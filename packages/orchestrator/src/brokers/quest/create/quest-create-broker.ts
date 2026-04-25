/**
 * PURPOSE: Persists a new quest.json on disk at status 'created' with empty-array defaults (or caller-provided initial workItems). Single source of truth for the initial quest file shape.
 *
 * USAGE:
 * const { questFilePath, questFolderPath } = await questCreateBroker({ questId, guildId, input });
 * // Returns: { questFilePath, questFolderPath }; quest.json is on disk under guild/quests/{questId}/quest.json with empty workItems and empty planningNotes arrays at status 'created'.
 *
 * Optionally seed work items in the same persist so callers (like questUserAddBroker)
 * don't need a second persist+outbox event for the initial chaoswhisperer item:
 *   await questCreateBroker({ questId, guildId, input, initialWorkItems: [chaosItem] });
 *
 * WHEN-TO-USE: Anywhere a quest file needs to be produced at status 'created' (user-initiated add, hydrator walk starting point).
 * WHEN-NOT-TO-USE: To modify an existing quest — use questModifyBroker.
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  fileContentsContract,
  filePathContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type {
  AddQuestInput,
  FilePath,
  GuildId,
  QuestId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';

import { questPersistBroker } from '../persist/quest-persist-broker';
import { questResolveQuestsPathBroker } from '../resolve-quests-path/quest-resolve-quests-path-broker';

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

export const questCreateBroker = async ({
  questId,
  guildId,
  input,
  initialWorkItems,
}: {
  questId: QuestId;
  guildId: GuildId;
  input: AddQuestInput;
  initialWorkItems?: WorkItem[];
}): Promise<{ questFilePath: FilePath; questFolderPath: FilePath }> => {
  const { questsPath } = questResolveQuestsPathBroker({ guildId });
  const questsBasePath = filePathContract.parse(questsPath);
  await fsMkdirAdapter({ filepath: questsBasePath });

  const questFolderPath = filePathContract.parse(
    pathJoinAdapter({ paths: [questsBasePath, questId] }),
  );
  await fsMkdirAdapter({ filepath: questFolderPath });

  const initialQuest = questContract.parse({
    id: questId,
    folder: questId,
    title: input.title,
    status: 'created',
    createdAt: new Date().toISOString(),
    designDecisions: [],
    steps: [],
    toolingRequirements: [],
    contracts: [],
    flows: [],
    needsDesign: false,
    userRequest: input.userRequest,
    workItems: initialWorkItems ?? [],
    wardResults: [],
    planningNotes: { surfaceReports: [], blightReports: [] },
    ...(input.questSource === undefined ? {} : { questSource: input.questSource }),
  });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questFolderPath, QUEST_FILE_NAME] }),
  );
  const contents = fileContentsContract.parse(
    JSON.stringify(initialQuest, null, JSON_INDENT_SPACES),
  );
  await questPersistBroker({ questFilePath, contents, questId });

  return { questFilePath, questFolderPath };
};
