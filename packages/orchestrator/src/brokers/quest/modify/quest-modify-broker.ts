/**
 * PURPOSE: Upserts data into an existing quest (steps, toolingRequirements, contracts, flows, designDecisions)
 *
 * USAGE:
 * const result = await questModifyBroker({ input: ModifyQuestInputStub({ questId: 'add-auth', flows: [...] }) });
 * // Returns: { success: true } or { success: false, error: 'Quest not found' }
 *
 * UPSERT SEMANTICS:
 * - Items with _delete: true => removed from quest
 * - Items with existing ID in quest => deep merge (scalar overwrite, id-arrays recurse)
 * - Items with new ID => add to array
 * - Items in quest but not in input => unchanged
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { fileContentsContract, filePathContract } from '@dungeonmaster/shared/contracts';

import { questPersistBroker } from '../persist/quest-persist-broker';
import { modifyQuestInputContract } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { modifyQuestResultContract } from '../../../contracts/modify-quest-result/modify-quest-result-contract';
import type { ModifyQuestResult } from '../../../contracts/modify-quest-result/modify-quest-result-contract';
import { hasQuestGateContentGuard } from '@dungeonmaster/shared/guards';
import { questHasValidStatusTransitionGuard } from '../../../guards/quest-has-valid-status-transition/quest-has-valid-status-transition-guard';
import { questArrayUpsertTransformer } from '../../../transformers/quest-array-upsert/quest-array-upsert-transformer';
import { questDuplicateIdMessageTransformer } from '../../../transformers/quest-duplicate-id-message/quest-duplicate-id-message-transformer';
import { questHasUniqueSiblingIdsGuard } from '../../../guards/quest-has-unique-sibling-ids/quest-has-unique-sibling-ids-guard';
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

    // Validate no duplicate IDs within incoming arrays
    const hasUniqueIds = questHasUniqueSiblingIdsGuard({ updates: validated });
    if (!hasUniqueIds) {
      const duplicateError = questDuplicateIdMessageTransformer({ updates: validated });
      return modifyQuestResultContract.parse({
        success: false,
        error: duplicateError ?? 'Duplicate IDs found in input',
      });
    }

    const { questPath } = await questFindQuestPathBroker({ questId: validated.questId });

    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );

    const loadedQuest = await questLoadBroker({ questFilePath });
    const quest = { ...loadedQuest };

    if (validated.designDecisions) {
      quest.designDecisions = questArrayUpsertTransformer({
        existing: quest.designDecisions,
        updates: validated.designDecisions as typeof quest.designDecisions,
      });
    }

    if (validated.steps) {
      quest.steps = questArrayUpsertTransformer({
        existing: quest.steps,
        updates: validated.steps as typeof quest.steps,
      });
    }

    if (validated.toolingRequirements) {
      quest.toolingRequirements = questArrayUpsertTransformer({
        existing: quest.toolingRequirements,
        updates: validated.toolingRequirements as typeof quest.toolingRequirements,
      });
    }

    if (validated.contracts) {
      quest.contracts = questArrayUpsertTransformer({
        existing: quest.contracts,
        updates: validated.contracts as typeof quest.contracts,
      });
    }

    if (validated.flows) {
      quest.flows = questArrayUpsertTransformer({
        existing: quest.flows,
        updates: validated.flows as typeof quest.flows,
      });
    }

    if (validated.title) {
      quest.title = validated.title as typeof quest.title;
    }

    if (validated.designPort !== undefined) {
      quest.designPort = validated.designPort as typeof quest.designPort;
    }

    if (validated.workItems) {
      quest.workItems = questArrayUpsertTransformer({
        existing: quest.workItems,
        updates: validated.workItems as typeof quest.workItems,
      });
    }

    if (validated.wardResults) {
      quest.wardResults = questArrayUpsertTransformer({
        existing: quest.wardResults,
        updates: validated.wardResults,
      });
    }

    if (validated.status) {
      const isValidTransition = questHasValidStatusTransitionGuard({
        currentStatus: quest.status,
        nextStatus: validated.status,
      });

      if (!isValidTransition) {
        return modifyQuestResultContract.parse({
          success: false,
          error: `Invalid status transition: ${quest.status} -> ${validated.status}`,
        });
      }

      const hasRequiredContent = hasQuestGateContentGuard({
        quest,
        nextStatus: validated.status,
      });

      if (!hasRequiredContent) {
        return modifyQuestResultContract.parse({
          success: false,
          error: `Missing required content for transition to ${validated.status}`,
        });
      }

      quest.status = validated.status;
    }

    quest.updatedAt = new Date().toISOString() as typeof quest.updatedAt;

    // Write updated quest back to quest.json
    const questJson = fileContentsContract.parse(JSON.stringify(quest, null, JSON_INDENT_SPACES));
    await questPersistBroker({ questFilePath, contents: questJson, questId: validated.questId });

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
