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

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { fileContentsContract, filePathContract } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { modifyQuestInputContract } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { modifyQuestResultContract } from '../../../contracts/modify-quest-result/modify-quest-result-contract';
import type { ModifyQuestResult } from '../../../contracts/modify-quest-result/modify-quest-result-contract';
import { questArrayUpsertTransformer } from '../../../transformers/quest-array-upsert/quest-array-upsert-transformer';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

export const questModifyBroker = async ({
  input,
}: {
  input: ModifyQuestInput;
}): Promise<ModifyQuestResult> => {
  try {
    const validated = modifyQuestInputContract.parse(input);

    const { questPath } = await questFindQuestPathBroker({ questId: validated.questId });

    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );

    const loadedQuest = await questLoadBroker({ questFilePath });
    const quest = { ...loadedQuest };

    if (validated.requirements) {
      quest.requirements = questArrayUpsertTransformer({
        existing: quest.requirements,
        updates: validated.requirements,
      });
    }

    if (validated.designDecisions) {
      quest.designDecisions = questArrayUpsertTransformer({
        existing: quest.designDecisions,
        updates: validated.designDecisions,
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

    if (validated.contracts) {
      quest.contracts = questArrayUpsertTransformer({
        existing: quest.contracts,
        updates: validated.contracts,
      });
    }

    quest.updatedAt = new Date().toISOString() as typeof quest.updatedAt;

    // Write updated quest back to quest.json
    const questJson = fileContentsContract.parse(JSON.stringify(quest, null, JSON_INDENT_SPACES));
    await fsWriteFileAdapter({ filePath: questFilePath, contents: questJson });

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
