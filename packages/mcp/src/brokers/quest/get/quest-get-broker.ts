/**
 * PURPOSE: Retrieves a quest by ID from the quest.json files in .dungeonmaster-quests folders
 *
 * USAGE:
 * const result = await questGetBroker({ input: GetQuestInputStub({ questId: 'add-auth' }) });
 * // Returns: { success: true, quest: {...} } or { success: false, error: 'Quest not found' }
 */

import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { GetQuestInput } from '../../../contracts/get-quest-input/get-quest-input-contract';
import { getQuestResultContract } from '../../../contracts/get-quest-result/get-quest-result-contract';
import type { GetQuestResult } from '../../../contracts/get-quest-result/get-quest-result-contract';
import { questsFolderEnsureBroker } from '../../quests-folder/ensure/quests-folder-ensure-broker';
import { questFolderFindBroker } from '../folder-find/quest-folder-find-broker';

export const questGetBroker = async ({
  input,
}: {
  input: GetQuestInput;
}): Promise<GetQuestResult> => {
  try {
    const validated = getQuestInputContract.parse(input);

    // Ensure folder exists before searching
    const { questsBasePath } = await questsFolderEnsureBroker();

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

    return getQuestResultContract.parse({
      success: true,
      quest: findResult.quest,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return getQuestResultContract.parse({
      success: false,
      error: errorMessage,
    });
  }
};
