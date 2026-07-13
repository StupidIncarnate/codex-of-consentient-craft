/**
 * PURPOSE: Insert retry/fix work items into the quest and update downstream deps via replacement mapping
 *
 * USAGE:
 * await questWorkItemInsertBroker({ questId, quest, newWorkItems, replacementMapping });
 * // Modifies workItems in quest with replacement mapping, appends new items, recalculates status, persists
 */

import type { AdapterResult, Quest, QuestId, WorkItem } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import type { ReplacementEntry } from '../../../contracts/replacement-entry/replacement-entry-contract';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const questWorkItemInsertBroker = async ({
  questId,
  quest,
  newWorkItems,
  replacementMapping,
}: {
  questId: QuestId;
  quest: Quest;
  newWorkItems: WorkItem[];
  replacementMapping?: ReplacementEntry[];
}): Promise<AdapterResult> => {
  const updatedWorkItems = [...quest.workItems];

  if (replacementMapping) {
    for (const { oldId, newId } of replacementMapping) {
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
  // re-opens the quest to in_progress — which is exactly what the work items now imply.
  await questModifyBroker({
    input: {
      questId,
      workItems: updatedWorkItems,
    } as ModifyQuestInput,
  });
  return adapterResultContract.parse({ success: true });
};
