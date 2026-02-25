/**
 * PURPOSE: Creates a new quest JSON file in the project's quests directory
 *
 * USAGE:
 * const result = await questAddBroker({ input: AddQuestInputStub({ title: 'Add Auth', userRequest: 'User wants...' }), guildId: GuildIdStub() });
 * // Returns: { success: true, questId: '<uuid>', questFolder: '<uuid>', filePath: '/path/to/quest.json' }
 */

import { pathJoinAdapter, fsMkdirAdapter } from '@dungeonmaster/shared/adapters';
import {
  questContract,
  fileContentsContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type { GuildId } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { addQuestInputContract } from '../../../contracts/add-quest-input/add-quest-input-contract';
import type { AddQuestInput } from '../../../contracts/add-quest-input/add-quest-input-contract';
import { addQuestResultContract } from '../../../contracts/add-quest-result/add-quest-result-contract';
import type { AddQuestResult } from '../../../contracts/add-quest-result/add-quest-result-contract';
import { questResolveQuestsPathBroker } from '../resolve-quests-path/quest-resolve-quests-path-broker';

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

export const questAddBroker = async ({
  input,
  guildId,
}: {
  input: AddQuestInput;
  guildId: GuildId;
}): Promise<AddQuestResult> => {
  try {
    // Validate input
    const validated = addQuestInputContract.parse(input);

    // Generate unique quest ID (UUID) used as both ID and folder name
    const questId = crypto.randomUUID();
    const questFolder = questId;

    // Resolve quests directory for this project and ensure it exists
    const { questsPath } = questResolveQuestsPathBroker({ guildId });
    const questsBasePath = filePathContract.parse(questsPath);
    await fsMkdirAdapter({ filepath: questsBasePath });

    // Create Quest object with all required fields
    const quest = questContract.parse({
      id: questId,
      folder: questFolder,
      title: validated.title,
      status: 'created' as const,
      createdAt: new Date().toISOString(),
      executionLog: [],
      requirements: [],
      designDecisions: [],
      contexts: [],
      observables: [],
      steps: [],
      toolingRequirements: [],
      userRequest: validated.userRequest,
    });

    // Create quest folder
    const questFolderPath = pathJoinAdapter({ paths: [questsBasePath, questFolder] });
    await fsMkdirAdapter({ filepath: questFolderPath });

    // Write quest.json file
    const questFilePath = pathJoinAdapter({ paths: [questFolderPath, QUEST_FILE_NAME] });
    const questJson = fileContentsContract.parse(JSON.stringify(quest, null, JSON_INDENT_SPACES));
    await fsWriteFileAdapter({ filePath: questFilePath, contents: questJson });

    return addQuestResultContract.parse({
      success: true,
      questId,
      questFolder,
      filePath: questFilePath,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return addQuestResultContract.parse({
      success: false,
      error: errorMessage,
    });
  }
};
