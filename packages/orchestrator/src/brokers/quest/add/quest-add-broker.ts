/**
 * PURPOSE: Creates a new quest JSON file in the project's quests directory
 *
 * USAGE:
 * const result = await questAddBroker({ input: AddQuestInputStub({ title: 'Add Auth', userRequest: 'User wants...' }), projectId: ProjectIdStub() });
 * // Returns: { success: true, questId: 'add-auth', questFolder: '001-add-auth', filePath: '/path/to/quest.json' }
 */

import { pathJoinAdapter, fsMkdirAdapter } from '@dungeonmaster/shared/adapters';
import {
  questContract,
  fileContentsContract,
  filePathContract,
  contentTextContract,
} from '@dungeonmaster/shared/contracts';
import type { ProjectId } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { addQuestInputContract } from '../../../contracts/add-quest-input/add-quest-input-contract';
import type { AddQuestInput } from '../../../contracts/add-quest-input/add-quest-input-contract';
import { addQuestResultContract } from '../../../contracts/add-quest-result/add-quest-result-contract';
import type { AddQuestResult } from '../../../contracts/add-quest-result/add-quest-result-contract';
import { textToKebabCaseTransformer } from '../../../transformers/text-to-kebab-case/text-to-kebab-case-transformer';
import { questFolderSequenceTransformer } from '../../../transformers/quest-folder-sequence/quest-folder-sequence-transformer';
import { questResolveQuestsPathBroker } from '../resolve-quests-path/quest-resolve-quests-path-broker';

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

export const questAddBroker = async ({
  input,
  projectId,
}: {
  input: AddQuestInput;
  projectId: ProjectId;
}): Promise<AddQuestResult> => {
  try {
    // Validate input
    const validated = addQuestInputContract.parse(input);

    // Generate quest ID from title (kebab-case)
    const questId = textToKebabCaseTransformer({
      text: contentTextContract.parse(validated.title),
    });

    // Resolve quests directory for this project and ensure it exists
    const { questsPath } = questResolveQuestsPathBroker({ projectId });
    const questsBasePath = filePathContract.parse(questsPath);
    await fsMkdirAdapter({ filepath: questsBasePath });

    // Scan existing folders to get next sequence number
    const existingFolders = fsReaddirAdapter({ dirPath: questsBasePath });

    const sequenceNumber = questFolderSequenceTransformer({ folders: existingFolders });
    const questFolder = `${sequenceNumber}-${questId}`;

    // Create Quest object with all required fields
    const quest = questContract.parse({
      id: questId,
      folder: questFolder,
      title: validated.title,
      status: 'in_progress' as const,
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
