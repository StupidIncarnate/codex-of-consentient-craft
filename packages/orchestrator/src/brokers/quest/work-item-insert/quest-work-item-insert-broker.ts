/**
 * PURPOSE: Insert retry/fix work items into the quest and update downstream deps via replacement mapping
 *
 * USAGE:
 * await questWorkItemInsertBroker({ questId, quest, newWorkItems, replacementMapping });
 * // Modifies workItems in quest with replacement mapping, appends new items, recalculates status,
 * // persists, and returns questModifyBroker's own result (success, or success: false plus why)
 */

import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestResult } from '@dungeonmaster/shared/contracts';
import { replacementEntryContract } from '../../../contracts/replacement-entry/replacement-entry-contract';
import type { ReplacementEntry } from '../../../contracts/replacement-entry/replacement-entry-contract';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const questWorkItemInsertBroker = async ({
  questId,
  quest,
  newWorkItems,
  replacementMapping,
}: {
  questId: Quest['id'];
  quest: Quest;
  newWorkItems: WorkItem[];
  replacementMapping?: ReplacementEntry[];
}): Promise<ModifyQuestResult> => {
  const updatedWorkItems = [...quest.workItems];

  if (replacementMapping) {
    const entries = replacementMapping.map((entry) => replacementEntryContract.parse(entry));
    for (const { oldId, newId } of entries) {
      for (const workItem of updatedWorkItems) {
        if (workItem.dependsOn.some((id) => id === oldId)) {
          workItem.dependsOn = workItem.dependsOn.map((id) => (id === oldId ? newId : id));
        }
      }
    }
  }

  updatedWorkItems.push(...newWorkItems);

  // No explicit status: questModifyBroker re-derives it from the updated work items. A recovery
  // splice adds pending retry items (and rewires deps off the failed item), so the derived status
  // re-opens the quest to in_progress — which is exactly what the work items now imply. The modify
  // result is returned rather than discarded, so a caller can tell a failed splice from a real one.
  return questModifyBroker({
    input: modifyQuestInputContract.parse({
      questId,
      workItems: updatedWorkItems,
    }),
  });
};
