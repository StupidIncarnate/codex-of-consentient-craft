/**
 * PURPOSE: Retrieves a quest by ID from the database
 *
 * USAGE:
 * const result = await questGetBroker({ input: GetQuestInputStub({ questId: 'add-auth' }) });
 * // Returns: { success: true, quest: {...} } or { success: false, error: 'Quest not found' }
 */

import { lowdbDatabaseAdapter } from '../../../adapters/lowdb/database/lowdb-database-adapter';
import { getQuestInputContract } from '../../../contracts/get-quest-input/get-quest-input-contract';
import type { GetQuestInput } from '../../../contracts/get-quest-input/get-quest-input-contract';
import { getQuestResultContract } from '../../../contracts/get-quest-result/get-quest-result-contract';
import type { GetQuestResult } from '../../../contracts/get-quest-result/get-quest-result-contract';
import { questsFolderEnsureBroker } from '../../quests-folder/ensure/quests-folder-ensure-broker';

export const questGetBroker = async ({
  input,
}: {
  input: GetQuestInput;
}): Promise<GetQuestResult> => {
  try {
    const validated = getQuestInputContract.parse(input);

    // Ensure folder and db.json exist before reading
    const { dbPath } = await questsFolderEnsureBroker();

    const db = lowdbDatabaseAdapter({ dbPath });
    const database = await db.read();

    const quest = database.quests.find((q) => q.id === validated.questId);

    if (!quest) {
      return getQuestResultContract.parse({
        success: false,
        error: `Quest not found: ${validated.questId}`,
      });
    }

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
