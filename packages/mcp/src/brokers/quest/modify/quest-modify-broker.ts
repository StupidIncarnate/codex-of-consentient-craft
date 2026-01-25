/**
 * PURPOSE: Upserts data into an existing quest (contexts, observables, steps, toolingRequirements)
 *
 * USAGE:
 * const result = await questModifyBroker({ input: ModifyQuestInputStub({ questId: 'add-auth', contexts: [...] }) });
 * // Returns: { success: true } or { success: false, error: 'Quest not found' }
 *
 * UPSERT SEMANTICS:
 * - Items with existing ID in quest => update (merge fields)
 * - Items with new ID => add to array
 * - Items in quest but not in input => unchanged (no deletions)
 */

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';
import { modifyQuestInputContract } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { modifyQuestResultContract } from '../../../contracts/modify-quest-result/modify-quest-result-contract';
import type { ModifyQuestResult } from '../../../contracts/modify-quest-result/modify-quest-result-contract';
import { questArrayUpsertTransformer } from '../../../transformers/quest-array-upsert/quest-array-upsert-transformer';
import { questsFolderEnsureBroker } from '../../quests-folder/ensure/quests-folder-ensure-broker';
import { questFolderFindBroker } from '../folder-find/quest-folder-find-broker';

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

export const questModifyBroker = async ({
  input,
}: {
  input: ModifyQuestInput;
}): Promise<ModifyQuestResult> => {
  try {
    const validated = modifyQuestInputContract.parse(input);

    // Ensure folder exists before searching
    const { questsBasePath } = await questsFolderEnsureBroker();

    const findResult = await questFolderFindBroker({
      questId: validated.questId,
      questsPath: questsBasePath,
    });

    if (!findResult.found) {
      return modifyQuestResultContract.parse({
        success: false,
        error: `Quest not found: ${validated.questId}`,
      });
    }

    const quest = { ...findResult.quest };
    const { folderPath } = findResult;

    if (validated.contexts) {
      quest.contexts = questArrayUpsertTransformer({
        existing: quest.contexts,
        updates: validated.contexts,
      });
    }

    if (validated.observables) {
      quest.observables = questArrayUpsertTransformer({
        existing: quest.observables,
        updates: validated.observables,
      });
    }

    if (validated.steps) {
      quest.steps = questArrayUpsertTransformer({
        existing: quest.steps,
        updates: validated.steps,
      });
    }

    if (validated.toolingRequirements) {
      quest.toolingRequirements = questArrayUpsertTransformer({
        existing: quest.toolingRequirements,
        updates: validated.toolingRequirements,
      });
    }

    quest.updatedAt = new Date().toISOString() as typeof quest.updatedAt;

    // Write updated quest back to quest.json
    const questFilePath = pathJoinAdapter({ paths: [folderPath, QUEST_FILE_NAME] });
    const questJson = fileContentsContract.parse(JSON.stringify(quest, null, JSON_INDENT_SPACES));
    await fsWriteFileAdapter({ filepath: questFilePath, contents: questJson });

    return modifyQuestResultContract.parse({
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return modifyQuestResultContract.parse({
      success: false,
      error: errorMessage,
    });
  }
};
