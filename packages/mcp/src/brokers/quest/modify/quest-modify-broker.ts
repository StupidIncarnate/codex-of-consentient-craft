/**
 * PURPOSE: Upserts data into an existing quest (contexts, observables, tasks, steps, toolingRequirements)
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

import { lowdbDatabaseAdapter } from '../../../adapters/lowdb/database/lowdb-database-adapter';
import { modifyQuestInputContract } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { modifyQuestResultContract } from '../../../contracts/modify-quest-result/modify-quest-result-contract';
import type { ModifyQuestResult } from '../../../contracts/modify-quest-result/modify-quest-result-contract';
import { questArrayUpsertTransformer } from '../../../transformers/quest-array-upsert/quest-array-upsert-transformer';
import { questsFolderEnsureBroker } from '../../quests-folder/ensure/quests-folder-ensure-broker';

export const questModifyBroker = async ({
  input,
}: {
  input: ModifyQuestInput;
}): Promise<ModifyQuestResult> => {
  try {
    const validated = modifyQuestInputContract.parse(input);

    // Ensure folder and db.json exist before reading
    const { dbPath } = await questsFolderEnsureBroker();

    const db = lowdbDatabaseAdapter({ dbPath });
    const database = await db.read();

    const questIndex = database.quests.findIndex((q) => q.id === validated.questId);

    if (questIndex < 0) {
      return modifyQuestResultContract.parse({
        success: false,
        error: `Quest not found: ${validated.questId}`,
      });
    }

    const quest = database.quests[questIndex];

    if (!quest) {
      return modifyQuestResultContract.parse({
        success: false,
        error: `Quest not found: ${validated.questId}`,
      });
    }

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

    if (validated.tasks) {
      quest.tasks = questArrayUpsertTransformer({
        existing: quest.tasks,
        updates: validated.tasks,
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

    database.quests[questIndex] = quest;
    await db.write({ database });

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
