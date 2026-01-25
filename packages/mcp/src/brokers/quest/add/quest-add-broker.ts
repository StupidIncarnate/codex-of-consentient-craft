/**
 * PURPOSE: Creates a new quest JSON file in the .dungeonmaster-quests folder
 *
 * USAGE:
 * const result = await questAddBroker({ input: AddQuestInputStub({ title: 'Add Auth', userRequest: 'User wants...' }) });
 * // Returns: { success: true, questId: 'add-auth', questFolder: '001-add-auth', filePath: '/path/to/quest.json' }
 */

import { questContract } from '@dungeonmaster/shared/contracts';

import { addQuestInputContract } from '../../../contracts/add-quest-input/add-quest-input-contract';
import type { AddQuestInput } from '../../../contracts/add-quest-input/add-quest-input-contract';
import { addQuestResultContract } from '../../../contracts/add-quest-result/add-quest-result-contract';
import type { AddQuestResult } from '../../../contracts/add-quest-result/add-quest-result-contract';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { FolderName } from '../../../contracts/folder-name/folder-name-contract';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { textToKebabCaseTransformer } from '../../../transformers/text-to-kebab-case/text-to-kebab-case-transformer';
import { questFolderSequenceTransformer } from '../../../transformers/quest-folder-sequence/quest-folder-sequence-transformer';

const QUESTS_FOLDER_NAME = '.dungeonmaster-quests';
const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

export const questAddBroker = async ({
  input,
}: {
  input: AddQuestInput;
}): Promise<AddQuestResult> => {
  try {
    // Validate input
    const validated = addQuestInputContract.parse(input);

    // Generate quest ID from title (kebab-case)
    const questId = textToKebabCaseTransformer({
      text: contentTextContract.parse(validated.title),
    });

    // Find quests folder (use process.cwd() for now)
    const questsBasePath = pathJoinAdapter({ paths: [process.cwd(), QUESTS_FOLDER_NAME] });

    // Ensure quests folder exists
    await fsMkdirAdapter({ filepath: questsBasePath });

    // Scan existing folders to get next sequence number
    let existingFolders: readonly FolderName[] = [];
    try {
      existingFolders = await fsReaddirAdapter({ filepath: questsBasePath });
    } catch {
      // Directory doesn't exist or is empty - start with 001
      existingFolders = [];
    }

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
    await fsWriteFileAdapter({ filepath: questFilePath, contents: questJson });

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
