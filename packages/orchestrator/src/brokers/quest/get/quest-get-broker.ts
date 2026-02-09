/**
 * PURPOSE: Retrieves a quest by ID from the quest.json files in .dungeonmaster-quests folders
 *
 * USAGE:
 * const result = await questGetBroker({ input: GetQuestInputStub({ questId: 'add-auth' }), startPath: FilePathStub({ value: '/project/src' }) });
 * // Returns: { success: true, quest: {...} } or { success: false, error: 'Quest not found' }
 *
 * const filtered = await questGetBroker({ input: GetQuestInputStub({ questId: 'add-auth', sections: ['requirements'] }), startPath: FilePathStub({ value: '/project/src' }) });
 * // Returns: { success: true, quest: {...} } with only requirements populated; other sections are empty arrays
 */

import { questsFolderEnsureBroker } from '@dungeonmaster/shared/brokers';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { GetQuestInput } from '../../../contracts/get-quest-input/get-quest-input-contract';
import { getQuestResultContract } from '../../../contracts/get-quest-result/get-quest-result-contract';
import type { GetQuestResult } from '../../../contracts/get-quest-result/get-quest-result-contract';
import { questSectionFilterTransformer } from '../../../transformers/quest-section-filter/quest-section-filter-transformer';
import { questFolderFindBroker } from '../folder-find/quest-folder-find-broker';

export const questGetBroker = async ({
  input,
  startPath,
}: {
  input: GetQuestInput;
  startPath: FilePath;
}): Promise<GetQuestResult> => {
  try {
    const validated = getQuestInputContract.parse(input);

    // Ensure folder exists before searching
    const { questsBasePath } = await questsFolderEnsureBroker({ startPath });

    const findResult = await questFolderFindBroker({
      questId: validated.questId,
      questsPath: questsBasePath,
    });

    if (!findResult.found) {
      return getQuestResultContract.parse({
        success: false,
        error: `Quest not found: ${validated.questId}`,
      });
    }

    const quest = questSectionFilterTransformer({
      quest: findResult.quest,
      ...(validated.sections !== undefined && { sections: validated.sections }),
    });

    return getQuestResultContract.parse({
      success: true,
      quest,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return getQuestResultContract.parse({
      success: false,
      error: errorMessage,
    });
  }
};
